"use client";
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import { COMMODITY_MAP, ROLE_META, fetchInsights, fetchSourceInfo, type APIInsight, type APISourceInfo, type UserRole } from "@/lib/data";
import { formatCurrency, cn } from "@/lib/utils";
import { useLang, tCommodity } from "@/lib/i18n";

export default function InsightsPage() {
  const [insights, setInsights]   = useState<APIInsight[]>([]);
  const [sourceInfo, setSourceInfo] = useState<APISourceInfo | null>(null);
  const [latestDate, setLatestDate] = useState("");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [role, setRole]           = useState<UserRole>("farmer");
  const { lang, t }               = useLang();

  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRole((localStorage.getItem("userRole") as UserRole) ?? "farmer");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([fetchInsights(), fetchSourceInfo()])
      .then(([insightData, srcInfo]) => { setInsights(insightData.insights); setLatestDate(insightData.latest_date??""); setSourceInfo(srcInfo); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const gainers  = insights.filter((i) => (i.change_pct??0) > 0).slice(0,5);
  const losers   = insights.filter((i) => (i.change_pct??0) < 0).sort((a,b)=>(a.change_pct??0)-(b.change_pct??0)).slice(0,5);
  const roleMeta = ROLE_META[role];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">💡 {t("marketInsightsTitle")}</h1>
          <p className="text-gray-500 text-sm mt-1">{t("liveMarketAnalysis")}{latestDate && ` · ${new Date(latestDate).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}`}</p>
        </div>
        {sourceInfo && (
          <a href={sourceInfo.source_url} target="_blank" rel="noreferrer" className="text-xs text-green-700 underline flex items-center gap-1 hover:text-green-900">
            {sourceInfo.source_name} <ExternalLink size={11} />
          </a>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">⚠️ {error}</div>}

      <div className={cn("rounded-xl border p-4 mb-6", roleMeta.bg)}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{roleMeta.icon}</span>
          <span className={cn("font-bold", roleMeta.color)}>{lang==="ml" ? {farmer:"കർഷകൻ",trader:"വ്യാപാരി",cooperative:"കോ-ഓപ്പറേറ്റീവ്",consumer:"ഉപഭോക്താവ്"}[role] : roleMeta.label} {t("view")}</span>
        </div>
        <p className="text-sm text-gray-700">{lang==="ml" ? {farmer:"മികച്ച വിലകൾ, വിപണി ട്രെൻഡുകൾ & എവിടെ വിൽക്കണം",trader:"വില വ്യത്യാസങ്ങൾ, ആർബിട്രേജ് & ദൈനംദിന ചലനങ്ങൾ",cooperative:"വിപണി അവലോകനം, സംഭരണ ​​ഇന്റലിജൻസ് & ട്രെൻഡുകൾ",consumer:"ലളിതമായ വില വിവരങ്ങൾ & ഏറ്റവും നല്ല നിരക്കുകൾ"}[role] : roleMeta.desc}</p>
      </div>

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-green-50">
              <div className="flex items-center gap-2"><TrendingUp size={16} className="text-green-700"/><h2 className="font-bold text-green-800">{t("topGainers")}</h2></div>
            </div>
            <div className="divide-y divide-gray-100">
              {gainers.length===0 ? <div className="px-5 py-4 text-gray-400 text-sm">{t("noGainersToday")}</div>
                : gainers.map((item) => {
                  const cInfo = COMMODITY_MAP[item.commodity_slug];
                  return (
                    <div key={item.commodity_id} className="px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2"><span className="text-xl">{cInfo?.icon??"🌿"}</span><div><div className="font-medium text-gray-800">{tCommodity(item.commodity_slug,lang)}</div><div className="text-xs text-gray-400">{item.commodity_category}</div></div></div>
                      <div className="text-right"><div className="font-bold text-gray-900">{formatCurrency(parseFloat(item.avg_price))}</div><div className="text-sm font-medium text-green-600">+{item.change_pct?.toFixed(2)}%</div></div>
                    </div>
                  );
                })}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-red-50">
              <div className="flex items-center gap-2"><TrendingDown size={16} className="text-red-600"/><h2 className="font-bold text-red-700">{t("topDecliners")}</h2></div>
            </div>
            <div className="divide-y divide-gray-100">
              {losers.length===0 ? <div className="px-5 py-4 text-gray-400 text-sm">{t("noDeclinerToday")}</div>
                : losers.map((item) => {
                  const cInfo = COMMODITY_MAP[item.commodity_slug];
                  return (
                    <div key={item.commodity_id} className="px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2"><span className="text-xl">{cInfo?.icon??"🌿"}</span><div><div className="font-medium text-gray-800">{tCommodity(item.commodity_slug,lang)}</div><div className="text-xs text-gray-400">{item.commodity_category}</div></div></div>
                      <div className="text-right"><div className="font-bold text-gray-900">{formatCurrency(parseFloat(item.avg_price))}</div><div className="text-sm font-medium text-red-500">{item.change_pct?.toFixed(2)}%</div></div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100"><h2 className="font-bold text-gray-800">{t("allCommoditiesSnapshot")}</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3">{t("commodity")}</th>
                <th className="text-right px-5 py-3">{t("avgPrice")}</th>
                <th className="text-right px-5 py-3">{t("range")}</th>
                <th className="text-right px-5 py-3">{t("dayChange")}</th>
                <th className="text-left px-5 py-3">{t("trend")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">{t("loadingInsights")}</td></tr>
              ) : insights.length===0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">{t("noData")}</td></tr>
              ) : insights.map((item) => {
                const cInfo = COMMODITY_MAP[item.commodity_slug];
                const chg   = item.change_pct;
                const TrendIcon = chg==null ? Minus : chg>0 ? TrendingUp : TrendingDown;
                const trendColor = chg==null ? "text-gray-400" : chg>0 ? "text-green-600" : "text-red-500";
                return (
                  <tr key={item.commodity_id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3"><div className="flex items-center gap-2"><span>{cInfo?.icon??"🌿"}</span><div><div className="font-medium text-gray-800">{tCommodity(item.commodity_slug,lang)}</div><div className="text-xs text-gray-400">{item.commodity_category}</div></div></div></td>
                    <td className="px-5 py-3 text-right font-bold text-gray-900">{formatCurrency(parseFloat(item.avg_price))}</td>
                    <td className="px-5 py-3 text-right text-xs text-gray-500">{formatCurrency(parseFloat(item.min_price))} – {formatCurrency(parseFloat(item.max_price))}</td>
                    <td className={cn("px-5 py-3 text-right font-medium",trendColor)}>{chg!=null ? `${chg>0?"+":""}${chg.toFixed(2)}%` : "—"}</td>
                    <td className="px-5 py-3"><TrendIcon size={16} className={trendColor} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
