"""
Kerala Commodity Price Forecasting Engine
==========================================
Gradient-boosted regression (sklearn GradientBoostingRegressor) trained on
per-commodity daily state-wide average prices.

Feature engineering:
  - lag features: 1d, 2d, 3d, 5d, 7d, 14d avg prices
  - rolling statistics: 7-day mean, 14-day mean, 30-day mean
  - rolling std over 7 and 14 days
  - day-of-week, day-of-month, month, week-of-year
  - price momentum (7-day pct change)
  - simple linear trend slope over last 7 days

Prediction horizons: 1 day, 7 days, 30 days.
Returns point forecast + ±1 std confidence band (widened proportionally for
longer horizons).

Design notes:
  - With only ~26 trading days available the model is deliberately lightweight
    (shallow trees, strong regularisation) to avoid over-fitting.
  - As data grows the model automatically improves on every call (no disk cache).
  - For commodities with < 7 data-points the engine returns a simple EWM
    (exponentially-weighted moving average) extrapolation with a honest
    "insufficient data" flag in the response.
"""

from __future__ import annotations

import math
import warnings
from datetime import date, timedelta
from typing import Any

import numpy as np
import pandas as pd
from django.db.models import Avg
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import RobustScaler

warnings.filterwarnings("ignore")


# ─── constants ────────────────────────────────────────────────────────────────

MIN_ROWS_FOR_ML = 10          # below this, fall back to EWM
LAG_DAYS       = [1, 2, 3, 5, 7, 14]
ROLL_WINDOWS   = [7, 14, 30]


# ─── data helpers ─────────────────────────────────────────────────────────────

def _load_daily_series(commodity_slug: str) -> pd.DataFrame:
    """
    Return a daily DataFrame (price_date index, avg_price column) for a commodity.
    Gaps between trading dates are forward-filled so features are continuous.
    """
    # import inside function to avoid circular imports at module load
    from .models import MarketPrice  # noqa: PLC0415

    qs = (
        MarketPrice.objects
        .filter(commodity__slug=commodity_slug)
        .values("price_date")
        .annotate(avg_price=Avg("price"))
        .order_by("price_date")
    )
    rows = list(qs)
    if not rows:
        return pd.DataFrame(columns=["price_date", "avg_price"])

    df = pd.DataFrame(rows)
    df["price_date"] = pd.to_datetime(df["price_date"])
    df = df.set_index("price_date").sort_index()
    df["avg_price"] = df["avg_price"].astype(float)

    # Fill calendar gaps with forward-fill (market closed = last known price)
    full_idx = pd.date_range(df.index.min(), df.index.max(), freq="D")
    df = df.reindex(full_idx).ffill()
    return df


def _build_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add time-series feature columns to df in-place. Returns df."""
    p = df["avg_price"]

    for lag in LAG_DAYS:
        df[f"lag_{lag}"] = p.shift(lag)

    for w in ROLL_WINDOWS:
        df[f"roll_mean_{w}"] = p.shift(1).rolling(w).mean()
        if w <= 14:
            df[f"roll_std_{w}"] = p.shift(1).rolling(w).std()

    # calendar
    df["dow"]       = df.index.dayofweek
    df["dom"]       = df.index.day
    df["month"]     = df.index.month
    df["week"]      = df.index.isocalendar().week.values.astype(int)

    # momentum: pct change over 7-day window
    df["momentum_7"] = p.pct_change(7).shift(1) * 100

    # trend slope (linear) over last 7 rows
    def _slope(arr: np.ndarray) -> float:
        x = np.arange(len(arr))
        if np.isnan(arr).any() or len(arr) < 2:
            return 0.0
        return float(np.polyfit(x, arr, 1)[0])

    df["trend_slope_7"] = (
        p.shift(1).rolling(7).apply(_slope, raw=True)
    )

    return df


# ─── feature column list (must match _build_features output) ──────────────────

def _feature_cols() -> list[str]:
    cols: list[str] = []
    for lag in LAG_DAYS:
        cols.append(f"lag_{lag}")
    for w in ROLL_WINDOWS:
        cols.append(f"roll_mean_{w}")
        if w <= 14:
            cols.append(f"roll_std_{w}")
    cols += ["dow", "dom", "month", "week", "momentum_7", "trend_slope_7"]
    return cols


# ─── model training ──────────────────────────────────────────────────────────

def _train_model(df: pd.DataFrame) -> tuple[GradientBoostingRegressor, RobustScaler, float]:
    """
    Train model on df. Returns (model, scaler, residual_std).
    """
    df = _build_features(df.copy())
    feat_cols = _feature_cols()
    df = df.dropna(subset=feat_cols + ["avg_price"])

    X = df[feat_cols].values
    y = df["avg_price"].values

    scaler = RobustScaler()
    X_s = scaler.fit_transform(X)

    # Keep hyper-parameters conservative for small datasets
    n = len(y)
    max_depth  = 2 if n < 30 else 3
    n_est      = min(80, max(20, n * 3))
    lr         = 0.08

    model = GradientBoostingRegressor(
        n_estimators=n_est,
        max_depth=max_depth,
        learning_rate=lr,
        subsample=0.85,
        min_samples_leaf=2,
        random_state=42,
    )
    model.fit(X_s, y)

    # in-sample residual std as baseline uncertainty estimate
    preds = model.predict(X_s)
    residual_std = float(np.std(y - preds))

    return model, scaler, residual_std


# ─── EWM fallback ─────────────────────────────────────────────────────────────

def _ewm_forecast(series: pd.Series, horizons: list[int]) -> dict[int, float]:
    span = min(7, len(series))
    ewm_val = float(series.ewm(span=span).mean().iloc[-1])
    # simple: last trend slope
    if len(series) >= 3:
        slope = float(np.polyfit(np.arange(len(series)), series.values, 1)[0])
    else:
        slope = 0.0
    return {h: max(0.0, ewm_val + slope * h) for h in horizons}


# ─── recursive multi-step forecast ────────────────────────────────────────────

def _recursive_forecast(
    df_feat: pd.DataFrame,
    model: GradientBoostingRegressor,
    scaler: RobustScaler,
    horizon: int,
) -> list[float]:
    """
    Walk forward `horizon` steps, using predicted values as lag inputs.
    Returns list of predicted prices.
    """
    feat_cols = _feature_cols()
    # Plain list of price values (historical + predicted)
    series: list[float] = list(df_feat["avg_price"].values.astype(float))
    last_date: pd.Timestamp = df_feat.index[-1]

    predictions: list[float] = []

    for step in range(1, horizon + 1):
        next_date = last_date + timedelta(days=step)
        arr = np.array(series, dtype=float)
        row: dict[str, float] = {}

        for lag in LAG_DAYS:
            row[f"lag_{lag}"] = float(arr[-lag]) if len(arr) >= lag else float(arr[0])

        for w in ROLL_WINDOWS:
            window = arr[-w:] if len(arr) >= w else arr
            row[f"roll_mean_{w}"] = float(np.mean(window))
            if w <= 14:
                row[f"roll_std_{w}"] = float(np.std(window)) if len(window) > 1 else 0.0

        row["dow"]   = next_date.weekday()
        row["dom"]   = next_date.day
        row["month"] = next_date.month
        row["week"]  = int(next_date.isocalendar()[1])

        if len(arr) >= 8:
            row["momentum_7"] = float((arr[-1] - arr[-8]) / (arr[-8] + 1e-9) * 100)
        else:
            row["momentum_7"] = 0.0

        window7 = arr[-7:] if len(arr) >= 7 else arr
        if len(window7) >= 2:
            row["trend_slope_7"] = float(np.polyfit(np.arange(len(window7)), window7, 1)[0])
        else:
            row["trend_slope_7"] = 0.0

        X_row = np.array([[row[c] for c in feat_cols]])
        X_row_s = scaler.transform(X_row)
        pred = max(0.0, float(model.predict(X_row_s)[0]))

        predictions.append(pred)
        series.append(pred)

    return predictions


# ─── confidence band widening ─────────────────────────────────────────────────

def _confidence_band(
    point: float,
    residual_std: float,
    step: int,
    n_training: int,
) -> tuple[float, float]:
    """
    Conservative CI: widen with sqrt(step) and squeeze for small training sets.
    Returns (low, high).
    """
    # Extra uncertainty when training data is small
    data_penalty = max(1.0, math.sqrt(30.0 / max(n_training, 5)))
    spread = residual_std * math.sqrt(step) * data_penalty * 1.5
    low  = max(0.0, point - spread)
    high = point + spread
    return round(low, 2), round(high, 2)


# ─── public API ───────────────────────────────────────────────────────────────

HORIZONS = {
    "1d":  1,
    "7d":  7,
    "30d": 30,
}


def forecast_commodity(commodity_slug: str) -> dict[str, Any]:
    """
    Main entry point.  Returns a dict ready to be JSON-serialised:

    {
      "commodity": slug,
      "latest_date": "YYYY-MM-DD",
      "latest_price": float,
      "method": "gradient_boost" | "ewm",
      "data_points": int,
      "sufficient_data": bool,
      "forecasts": {
          "1d": {
              "label": "Tomorrow",
              "days": 1,
              "point": float,
              "low":  float,
              "high": float,
              "daily": [{"date": "...", "point": x, "low": y, "high": z}]  // only for 7d/30d
          },
          ...
      }
    }
    """
    df = _load_daily_series(commodity_slug)

    if df.empty:
        return {
            "commodity": commodity_slug,
            "error": "no data",
            "sufficient_data": False,
        }

    n = len(df)
    latest_date  = df.index[-1].date().isoformat()
    latest_price = round(float(df["avg_price"].iloc[-1]), 2)

    horizons_list = sorted(HORIZONS.values())   # [1, 7, 30]

    if n < MIN_ROWS_FOR_ML:
        # EWM fallback
        ewm_vals = _ewm_forecast(df["avg_price"], horizons_list)
        last_std = float(df["avg_price"].std()) if n > 1 else latest_price * 0.05

        forecasts: dict[str, Any] = {}
        for label, h in HORIZONS.items():
            pt = round(ewm_vals[h], 2)
            lo, hi = _confidence_band(pt, last_std, h, n)
            entry: dict[str, Any] = {
                "label": _horizon_label(label),
                "days": h,
                "point": pt,
                "low": lo,
                "high": hi,
            }
            if h > 1:
                entry["daily"] = _ewm_daily_series(df["avg_price"], h, last_std, n)
            forecasts[label] = entry

        return {
            "commodity":      commodity_slug,
            "latest_date":    latest_date,
            "latest_price":   latest_price,
            "method":         "ewm",
            "data_points":    n,
            "sufficient_data": False,
            "forecasts":      forecasts,
        }

    # --- ML path ---
    model, scaler, residual_std = _train_model(df)

    # build feature df for recursive forecast
    df_feat = _build_features(df.copy())

    forecasts = {}
    for label, h in HORIZONS.items():
        preds = _recursive_forecast(df_feat, model, scaler, h)
        pt = round(preds[-1] if h == 1 else preds[h - 1], 2)

        if h == 1:
            lo, hi = _confidence_band(pt, residual_std, 1, n)
            forecasts[label] = {
                "label": _horizon_label(label),
                "days": h,
                "point": pt,
                "low": lo,
                "high": hi,
            }
        else:
            # full daily series
            daily = []
            base_date = df.index[-1]
            for i, p_val in enumerate(preds[:h], start=1):
                lo_i, hi_i = _confidence_band(p_val, residual_std, i, n)
                daily.append({
                    "date":  (base_date + timedelta(days=i)).date().isoformat(),
                    "point": round(float(p_val), 2),
                    "low":   lo_i,
                    "high":  hi_i,
                })
            lo_final, hi_final = _confidence_band(float(preds[h - 1]), residual_std, h, n)
            forecasts[label] = {
                "label": _horizon_label(label),
                "days":  h,
                "point": round(float(preds[h - 1]), 2),
                "low":   lo_final,
                "high":  hi_final,
                "daily": daily,
            }

    return {
        "commodity":      commodity_slug,
        "latest_date":    latest_date,
        "latest_price":   latest_price,
        "method":         "gradient_boost",
        "data_points":    n,
        "sufficient_data": True,
        "forecasts":      forecasts,
    }


def forecast_all() -> dict[str, Any]:
    """Return forecasts for every active commodity."""
    from .models import Commodity  # noqa: PLC0415

    slugs = list(Commodity.objects.filter(is_active=True).values_list("slug", flat=True))
    results = {}
    for slug in slugs:
        results[slug] = forecast_commodity(slug)
    return results


# ─── helpers ──────────────────────────────────────────────────────────────────

def _horizon_label(key: str) -> str:
    return {"1d": "Tomorrow", "7d": "Next 7 Days", "30d": "Next 30 Days"}[key]


def _ewm_daily_series(
    series: pd.Series,
    horizon: int,
    std: float,
    n: int,
) -> list[dict[str, Any]]:
    span = min(7, len(series))
    base = float(series.ewm(span=span).mean().iloc[-1])
    slope = 0.0
    if len(series) >= 3:
        slope = float(np.polyfit(np.arange(len(series)), series.values, 1)[0])

    last_date = series.index[-1] if hasattr(series.index[-1], "date") else pd.Timestamp(series.index[-1])

    daily = []
    for i in range(1, horizon + 1):
        pt = max(0.0, base + slope * i)
        lo, hi = _confidence_band(pt, std, i, n)
        daily.append({
            "date":  (last_date + timedelta(days=i)).date().isoformat(),
            "point": round(pt, 2),
            "low":   lo,
            "high":  hi,
        })
    return daily
