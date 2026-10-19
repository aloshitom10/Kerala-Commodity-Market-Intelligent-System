"""
API views for Kerala Commodity Price Intelligence Platform.

All price data is read-only and sourced from Kerala DES / Ecostat.
"""
import logging
from datetime import date, timedelta

from django.db.models import Avg, Max, Min, Count, Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Commodity, MarketPrice, DataIngestionLog
from .serializers import (
    CommoditySerializer,
    MarketPriceSerializer,
    DataIngestionLogSerializer,
)


# ─── Commodities ─────────────────────────────────────────────────────────────

class CommodityListView(generics.ListAPIView):
    """List all active commodities."""
    queryset = Commodity.objects.filter(is_active=True)
    serializer_class = CommoditySerializer


# ─── Prices ──────────────────────────────────────────────────────────────────

class PriceListView(generics.ListAPIView):
    """
    List market prices with optional filters.

    Query params:
        commodity   — slug or ID
        district    — district name (case-insensitive)
        centre      — market centre name (partial, case-insensitive)
        from_date   — YYYY-MM-DD
        to_date     — YYYY-MM-DD
        date        — single date YYYY-MM-DD (shorthand for from_date=to_date)
    """
    serializer_class = MarketPriceSerializer

    def get_queryset(self):
        qs = MarketPrice.objects.select_related("commodity").all()

        commodity = self.request.query_params.get("commodity")
        if commodity:
            if commodity.isdigit():
                qs = qs.filter(commodity_id=commodity)
            else:
                qs = qs.filter(commodity__slug=commodity)

        district = self.request.query_params.get("district")
        if district:
            qs = qs.filter(district__iexact=district)

        centre = self.request.query_params.get("centre")
        if centre:
            qs = qs.filter(market_centre__icontains=centre)

        single_date = self.request.query_params.get("date")
        if single_date:
            qs = qs.filter(price_date=single_date)
        else:
            from_date = self.request.query_params.get("from_date")
            to_date = self.request.query_params.get("to_date")
            if from_date:
                qs = qs.filter(price_date__gte=from_date)
            if to_date:
                qs = qs.filter(price_date__lte=to_date)

        return qs.order_by("-price_date", "district", "market_centre")


@api_view(["GET"])
def latest_prices(request):
    """
    Latest available price for each commodity×district×centre combination.
    Optionally filter by commodity slug.
    """
    commodity = request.query_params.get("commodity")

    # Find the most recent date in the DB (or the last 7 days)
    latest = MarketPrice.objects.aggregate(latest=Max("price_date"))["latest"]
    if not latest:
        return Response({"results": [], "latest_date": None})

    qs = MarketPrice.objects.select_related("commodity").filter(price_date=latest)
    if commodity:
        if commodity.isdigit():
            qs = qs.filter(commodity_id=commodity)
        else:
            qs = qs.filter(commodity__slug=commodity)

    serializer = MarketPriceSerializer(qs, many=True)
    return Response({
        "latest_date": latest.isoformat(),
        "count": qs.count(),
        "results": serializer.data,
    })


@api_view(["GET"])
def price_summary(request):
    """
    Aggregated min/max/avg/latest price per commodity (across all markets).

    Query params:
        date        — YYYY-MM-DD  (defaults to latest available)
        district    — filter by district
    """
    price_date = request.query_params.get("date")
    district = request.query_params.get("district")

    if not price_date:
        latest = MarketPrice.objects.aggregate(latest=Max("price_date"))["latest"]
        if not latest:
            return Response({"results": [], "date": None})
        price_date = latest.isoformat()

    qs = MarketPrice.objects.filter(price_date=price_date)
    if district:
        qs = qs.filter(district__iexact=district)

    summary = (
        qs
        .values("commodity__id", "commodity__name", "commodity__slug", "commodity__category")
        .annotate(
            min_price=Min("price"),
            max_price=Max("price"),
            avg_price=Avg("price"),
            market_count=Count("id"),
        )
        .order_by("commodity__name")
    )

    results = [
        {
            "commodity_id": row["commodity__id"],
            "commodity_name": row["commodity__name"],
            "commodity_slug": row["commodity__slug"],
            "commodity_category": row["commodity__category"],
            "min_price": row["min_price"],
            "max_price": row["max_price"],
            "avg_price": row["avg_price"],
            "market_count": row["market_count"],
        }
        for row in summary
    ]

    return Response({"date": price_date, "results": results})


@api_view(["GET"])
def price_trends(request):
    """
    Daily avg price for a commodity over a date range.

    Query params (required):
        commodity   — slug
        from_date   — YYYY-MM-DD
        to_date     — YYYY-MM-DD
        district    — optional filter
    """
    commodity_slug = request.query_params.get("commodity")
    from_date = request.query_params.get("from_date")
    to_date = request.query_params.get("to_date")
    district = request.query_params.get("district")

    if not commodity_slug:
        return Response({"error": "commodity param is required"}, status=400)

    # Default date range: last 30 days
    if not to_date:
        to_date = date.today().isoformat()
    if not from_date:
        from_date = (date.today() - timedelta(days=30)).isoformat()

    qs = (
        MarketPrice.objects
        .filter(commodity__slug=commodity_slug, price_date__gte=from_date, price_date__lte=to_date)
    )
    if district:
        qs = qs.filter(district__iexact=district)

    daily = (
        qs
        .values("price_date")
        .annotate(avg_price=Avg("price"), min_price=Min("price"), max_price=Max("price"))
        .order_by("price_date")
    )

    return Response({
        "commodity": commodity_slug,
        "from_date": from_date,
        "to_date": to_date,
        "district": district,
        "data": list(daily),
    })


@api_view(["GET"])
def district_comparison(request):
    """
    Average price per district for a commodity on a given date (or latest).

    Query params:
        commodity   — slug (required)
        date        — YYYY-MM-DD (defaults to latest)
    """
    commodity_slug = request.query_params.get("commodity")
    if not commodity_slug:
        return Response({"error": "commodity param is required"}, status=400)

    price_date = request.query_params.get("date")
    if not price_date:
        latest = (
            MarketPrice.objects
            .filter(commodity__slug=commodity_slug)
            .aggregate(latest=Max("price_date"))["latest"]
        )
        if not latest:
            return Response({"commodity": commodity_slug, "date": None, "results": []})
        price_date = latest.isoformat()

    results = (
        MarketPrice.objects
        .filter(commodity__slug=commodity_slug, price_date=price_date)
        .values("district")
        .annotate(
            avg_price=Avg("price"),
            min_price=Min("price"),
            max_price=Max("price"),
            centre_count=Count("market_centre", distinct=True),
        )
        .order_by("district")
    )

    return Response({
        "commodity": commodity_slug,
        "date": price_date,
        "results": list(results),
    })


@api_view(["GET"])
def market_insights(request):
    """
    Platform-wide insights: top gainers, losers, and summary stats.

    Compares today's avg price vs yesterday's avg price for each commodity.
    """
    latest = MarketPrice.objects.aggregate(latest=Max("price_date"))["latest"]
    if not latest:
        return Response({"insights": [], "latest_date": None})

    prev_date = (latest - timedelta(days=1)).isoformat()
    latest_str = latest.isoformat()

    def agg_by_commodity(price_date_str):
        return {
            row["commodity__slug"]: row
            for row in (
                MarketPrice.objects
                .filter(price_date=price_date_str)
                .values("commodity__id", "commodity__name", "commodity__slug", "commodity__category")
                .annotate(avg_price=Avg("price"), min_price=Min("price"), max_price=Max("price"))
            )
        }

    today_data = agg_by_commodity(latest_str)
    prev_data = agg_by_commodity(prev_date)

    insights = []
    for slug, today in today_data.items():
        prev = prev_data.get(slug)
        change_pct = None
        if prev and prev["avg_price"] and today["avg_price"]:
            change_pct = float(
                (today["avg_price"] - prev["avg_price"]) / prev["avg_price"] * 100
            )

        insights.append({
            "commodity_id": today["commodity__id"],
            "commodity_name": today["commodity__name"],
            "commodity_slug": today["commodity__slug"],
            "commodity_category": today["commodity__category"],
            "avg_price": today["avg_price"],
            "min_price": today["min_price"],
            "max_price": today["max_price"],
            "prev_avg_price": prev["avg_price"] if prev else None,
            "change_pct": round(change_pct, 2) if change_pct is not None else None,
        })

    insights.sort(key=lambda x: x["change_pct"] or 0, reverse=True)

    return Response({
        "latest_date": latest_str,
        "prev_date": prev_date,
        "insights": insights,
    })


@api_view(["GET"])
def data_source_info(request):
    """
    Returns data source attribution and last ingestion status.
    """
    latest_log = DataIngestionLog.objects.filter(status__in=["success", "partial"]).first()
    latest_price = MarketPrice.objects.aggregate(latest=Max("price_date"))["latest"]

    return Response({
        "source_name": "Kerala DES — Market Intelligence",
        "source_url": "https://www.ecostat.kerala.gov.in/mi-prices-dashboard",
        "last_updated": latest_price.isoformat() if latest_price else None,
        "last_ingestion": DataIngestionLogSerializer(latest_log).data if latest_log else None,
    })


# ─── Ingestion Logs ──────────────────────────────────────────────────────────

class IngestionLogListView(generics.ListAPIView):
    """Recent ingestion run logs (last 20)."""
    queryset = DataIngestionLog.objects.all()[:20]
    serializer_class = DataIngestionLogSerializer


# ─── District list ───────────────────────────────────────────────────────────

@api_view(["GET"])
def district_list(request):
    """Return all districts that have price data."""
    districts = (
        MarketPrice.objects
        .values_list("district", flat=True)
        .distinct()
        .order_by("district")
    )
    return Response({"districts": list(districts)})


@api_view(["GET"])
def market_centres_list(request):
    """Return market centres, optionally filtered by district."""
    district = request.query_params.get("district")
    qs = MarketPrice.objects.values_list("market_centre", flat=True).distinct()
    if district:
        qs = qs.filter(district__iexact=district)
    return Response({"centres": sorted(set(qs))})


# ─── Forecasting ─────────────────────────────────────────────────────────────

logger = logging.getLogger(__name__)


@api_view(["GET"])
def commodity_forecast(request, commodity_slug: str):
    """
    AI price forecast for a single commodity.

    Returns point estimates + confidence bands for 1-day, 7-day, and 30-day
    horizons, with a daily breakdown for the multi-day horizons.

    Query params: none
    URL param: commodity_slug — e.g. /api/forecast/coconut/
    """
    from .forecasting import forecast_commodity  # lazy import — heavy deps
    try:
        result = forecast_commodity(commodity_slug)
        if "error" in result:
            return Response(result, status=404)
        return Response(result)
    except Exception as exc:
        logger.exception("Forecast failed for %s", commodity_slug)
        return Response({"error": str(exc)}, status=500)


@api_view(["GET"])
def all_forecasts(request):
    """
    AI price forecasts for ALL active commodities.
    Returns a dict keyed by commodity slug.
    """
    from .forecasting import forecast_all  # lazy import — heavy deps
    try:
        results = forecast_all()
        return Response(results)
    except Exception as exc:
        logger.exception("All-forecast failed")
        return Response({"error": str(exc)}, status=500)
