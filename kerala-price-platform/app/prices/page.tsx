"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TrendingUp, TrendingDown, Minus, RefreshCw, ExternalLink } from "lucide-react";
import {
  COMMODITIES, COMMODITY_MAP, DISTRICTS,
  fetchPriceSummary, fetchLatestPrices, fetchCentres, fetchSourceInfo,
  invalidateApi,
  type APIPriceSummaryItem, type APIMarketPrice, type APISourceInfo,
} from "@/lib/data";
import { formatCurrency, cn } from "@/lib/utils";
import { useLang, tCommodity, tDistrict } from "@/lib/i18n";

function PricesDashboard() {
  const searchParams = useSearchParams();
  const [commodity, setCommodity] = useState(searchParams.get("commodity") ?? "coconut");
  const [district, setDistrict]   = useState("Ernakulam");
  const [centre, setCentre]       = useState("");
  const [centres, setCentres]     = useState<string[]>([]);
  const [summary, setSummary]     = useState<APIPriceSummaryItem[]>([]);
  const [latestPrices, setLatestPrices] = useState<APIMarketPrice[]>([]);
  const [sourceInfo, setSourceInfo]     = useState<APISourceInfo | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const { lang, t }               = useLang();

  const commodityInfo = COMMODITY_MAP[commodity];

  useEffect(() => {
    fetchCentres(district)
      .then((d) => { setCentres(d.centres); if (d.centres.length > 0) setCentre(d.centres[0]); })
      .catch(() => setCentres([]));
  }, [district]);

  const loadData = (forceRefresh = false) => {
    if (forceRefresh) {
      invalidateApi("/prices/summary/");
      invalidateApi("/prices/latest/");
      invalidateApi("/source/");
    }
    setLoading(true);
    setError("");
    Promise.all([fetchPriceSummary(undefined, district), fetchLatestPrices(commodity), fetchSourceInfo()])
      .then(([summaryData, latestData, srcInfo]) => {
        setSummary(summaryData.results);
        setLatestPrices(latestData.results.filter((p) => p.district.toLowerCase() === district.toLowerCase()));
        setSourceInfo(srcInfo);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadData(); }, [commodity, district]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentSummary = summary.find((s) => s.commodity_slug === commodity);
  const centrePrice    = latestPrices.find((p) => p.market_centre === centre && p.commodity_slug === commodity)
                      ?? latestPrices.find((p) => p.commodity_slug === commodity);
  const currentPrice   = centrePrice ? parseFloat(centrePrice.price) : null;
  const prevDayPrice   = centrePrice?.prev_day_price ? parseFloat(centrePrice.prev_day_price) : null;
  const change         = currentPrice && prevDayPrice ? currentPrice - prevDayPrice : null;
  const changePct      = change && prevDayPrice ? (change / prevDayPrice) * 100 : null;
  const trendColor     = change == null ? "text-gray-500" : change > 0 ? "text-green-600" : change < 0 ? "text-red-500" : "text-gray-500";
  const TrendIcon      = change == null ? Minus : change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📊 {t("marketPriceDashboard")}</h1>
          <p className="text-gray-500 text-sm mt-1">{t("liveWholesale")}</p>
        </div>
        <button onClick={() => loadData(true)}
          className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-800 transition-colors">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {t("refresh")}
        </button>
      </div>

      {/* Selectors */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{t("commodity")}</label>
            <select value={commodity} onChange={(e) => setCommodity(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              {COMMODITIES.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {tCommodity(c.id, lang)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{t("district")}</label>
            <select value={district} onChange={(e) => setDistrict(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{tDistrict(d, lang)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{t("marketCentre")}</label>
            <select value={centre} onChange={(e) => setCentre(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              {centres.length === 0
                ? <option value="">{t("loading")}</option>
                : centres.map((m) => <option key={m} value={m}>{m}</option>)
              }
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">
          ⚠️ {t("backendError").replace("{0}", error)}
        </div>
      )}

      {/* Price Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border-2 border-green-400 p-5 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t("currentPrice")}</div>
          <div className="text-3xl font-bold text-green-700">
            {loading ? "—" : currentPrice ? formatCurrency(currentPrice) : "N/A"}
          </div>
          <div className="text-xs text-gray-400 mt-1">{t("perQuintal")}</div>
          <div className={cn("flex items-center gap-1 text-sm font-medium mt-2", trendColor)}>
            <TrendIcon size={14} />
            {change != null && changePct != null
              ? `${change > 0 ? "+" : ""}${change.toFixed(2)} (${changePct > 0 ? "+" : ""}${changePct.toFixed(1)}%)`
              : "—"}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t("minimum")}</div>
          <div className="text-2xl font-bold text-blue-600">
            {loading ? "—" : currentSummary?.min_price ? formatCurrency(parseFloat(currentSummary.min_price)) : "N/A"}
          </div>
          <div className="text-xs text-gray-400 mt-1">{t("acrossDistrict")} {tDistrict(district, lang)}</div>
          <div className="text-xs text-gray-400 mt-2">{t("lowestToday")}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t("maximum")}</div>
          <div className="text-2xl font-bold text-red-500">
            {loading ? "—" : currentSummary?.max_price ? formatCurrency(parseFloat(currentSummary.max_price)) : "N/A"}
          </div>
          <div className="text-xs text-gray-400 mt-1">{t("acrossDistrict")} {tDistrict(district, lang)}</div>
          <div className="text-xs text-gray-400 mt-2">{t("highestToday")}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t("average")}</div>
          <div className="text-2xl font-bold text-orange-500">
            {loading ? "—" : currentSummary?.avg_price ? formatCurrency(parseFloat(currentSummary.avg_price)) : "N/A"}
          </div>
          <div className="text-xs text-gray-400 mt-1">{t("acrossAllMarkets")}</div>
          <div className="text-xs text-gray-400 mt-2">{currentSummary?.market_count ?? "—"} {t("marketsReporting")}</div>
        </div>
      </div>

      {/* Market Info Banner */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <div className="text-2xl">{commodityInfo?.icon}</div>
        <div className="flex-1">
          <div className="font-semibold text-green-800">{tCommodity(commodity, lang)} · {centre || tDistrict(district, lang)}</div>
          <div className="text-sm text-green-700">{t("district")}: {tDistrict(district, lang)} · {t("category")}: {commodityInfo?.category}</div>
          {sourceInfo && (
            <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
              {t("data")} <a href={sourceInfo.source_url} target="_blank" rel="noreferrer" className="underline hover:text-green-800 flex items-center gap-0.5">
                {sourceInfo.source_name} <ExternalLink size={10} />
              </a>
              {sourceInfo.last_updated && ` · ${t("lastUpdated")} ${new Date(sourceInfo.last_updated).toLocaleDateString("en-IN")}`}
            </div>
          )}
        </div>
      </div>

      {/* All Commodities Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">{t("allCommodityPrices")} — {tDistrict(district, lang)}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{t("liveWholesale")}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3">{t("commodity")}</th>
                <th className="text-right px-5 py-3">{t("avgPrice")}</th>
                <th className="text-right px-5 py-3">{t("min")}</th>
                <th className="text-right px-5 py-3">{t("max")}</th>
                <th className="text-right px-5 py-3">{t("marketsCount")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">{t("loadingPrices")}</td></tr>
              ) : summary.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">{t("noData")}</td></tr>
              ) : (
                summary.map((s) => {
                  const cInfo     = COMMODITY_MAP[s.commodity_slug];
                  const isSelected = s.commodity_slug === commodity;
                  return (
                    <tr key={s.commodity_id} onClick={() => setCommodity(s.commodity_slug)}
                      className={cn("border-t border-gray-100 cursor-pointer hover:bg-green-50 transition-colors",
                        isSelected ? "bg-green-50 border-l-4 border-l-green-500" : "")}>
                      <td className="px-5 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          <span>{cInfo?.icon ?? "🌿"}</span>
                          <div>
                            <div>{tCommodity(s.commodity_slug, lang)}</div>
                            <div className="text-xs text-gray-400">{s.commodity_category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-gray-900">
                        {s.avg_price ? formatCurrency(parseFloat(s.avg_price)) : "—"}
                      </td>
                      <td className="px-5 py-3 text-right text-blue-600">
                        {s.min_price ? formatCurrency(parseFloat(s.min_price)) : "—"}
                      </td>
                      <td className="px-5 py-3 text-right text-red-500">
                        {s.max_price ? formatCurrency(parseFloat(s.max_price)) : "—"}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-500">{s.market_count}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function PricesPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="text-center py-12 text-gray-400">Loading prices…</div>
      </div>
    }>
      <PricesDashboard />
    </Suspense>
  );
}
