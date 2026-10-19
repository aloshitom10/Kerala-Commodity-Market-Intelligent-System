"use client";
import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus, Info, RefreshCw } from "lucide-react";
import { COMMODITIES, COMMODITY_MAP, fetchForecast, invalidateApi, type CommodityForecast, type ForecastHorizon, type ForecastDay } from "@/lib/data";
import { formatCurrency, cn } from "@/lib/utils";
import { useLang, tCommodity, type TKey } from "@/lib/i18n";

type HorizonKey = "1d"|"7d"|"30d";

function trendIcon(point: number, ref: number) {
  const d = point-ref;
  if (Math.abs(d)<ref*0.003) return <Minus size={16} className="text-gray-400"/>;
  return d>0 ? <TrendingUp size={16} className="text-green-600"/> : <TrendingDown size={16} className="text-red-500"/>;
}
function trendColor(point: number, ref: number) {
  const d = point-ref;
  if (Math.abs(d)<ref*0.003) return "text-gray-500";
  return d>0?"text-green-600":"text-red-500";
}

function ForecastChart({ latest_price, latest_date, horizon, todayLabel }: { latest_price:number; latest_date:string; horizon:ForecastHorizon; todayLabel:string }) {
  const anchor: ForecastDay = { date:latest_date, point:latest_price, low:latest_price, high:latest_price };
  const daily = horizon.daily ?? [{ date:"", point:horizon.point, low:horizon.low, high:horizon.high }];
  const data = [anchor,...daily].map((d)=>({ date:d.date.slice(5), fullDate:d.date, point:d.point, low:d.low, high:d.high }));
  const allVals = data.flatMap((d)=>[d.point,d.low,d.high]);
  const yMin = Math.floor(Math.min(...allVals)*0.97);
  const yMax = Math.ceil(Math.max(...allVals)*1.03);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{top:10,right:10,bottom:0,left:10}}>
        <defs>
          <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.18}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0.02}/></linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4f46e5" stopOpacity={1}/><stop offset="100%" stopColor="#4f46e5" stopOpacity={0.7}/></linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
        <XAxis dataKey="date" tick={{fontSize:11}} interval="preserveStartEnd"/>
        <YAxis domain={[yMin,yMax]} tickFormatter={(v)=>`₹${(v/1000).toFixed(0)}k`} tick={{fontSize:11}} width={52}/>
        <Tooltip formatter={(val,name)=>{ const l:Record<string,string>={point:"Forecast",high:"Upper",low:"Lower"}; return [formatCurrency(Number(val)),l[String(name)]??String(name)]; }} labelFormatter={(_l,pl)=>pl?.[0]?.payload?.fullDate??_l}/>
        <ReferenceLine x={data[0].date} stroke="#15803d" strokeDasharray="4 2" label={{value:todayLabel,position:"insideTopRight",fontSize:10,fill:"#15803d"}}/>
        <Area type="monotone" dataKey="high" stroke="none" fill="url(#bandGrad)" fillOpacity={1} legendType="none" activeDot={false}/>
        <Area type="monotone" dataKey="low"  stroke="none" fill="#ffffff"        fillOpacity={1} legendType="none" activeDot={false}/>
        <Area type="monotone" dataKey="point" name="Forecast" stroke="#4f46e5" strokeWidth={2.5} fill="url(#lineGrad)" fillOpacity={0.08} dot={{r:3,fill:"#4f46e5"}} activeDot={{r:5}}/>
      </AreaChart>
    </ResponsiveContainer>
  );
}

function DailyTable({ daily, referencePrice, t }: { daily:ForecastDay[]; referencePrice:number; t:(k:TKey)=>string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
            <th className="text-left px-4 py-2.5">{t("forecastDate")}</th>
            <th className="text-right px-4 py-2.5">{t("forecastCol")}</th>
            <th className="text-right px-4 py-2.5">{t("lowerCol")}</th>
            <th className="text-right px-4 py-2.5">{t("upperCol")}</th>
            <th className="text-right px-4 py-2.5">{t("vsToday2")}</th>
          </tr>
        </thead>
        <tbody>
          {daily.map((d)=>{
            const diff = d.point-referencePrice;
            const pct  = (diff/referencePrice)*100;
            return (
              <tr key={d.date} className="border-t border-gray-100 hover:bg-indigo-50/30">
                <td className="px-4 py-2.5 text-gray-700">{new Date(d.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</td>
                <td className="px-4 py-2.5 text-right font-bold text-gray-900">{formatCurrency(d.point)}</td>
                <td className="px-4 py-2.5 text-right text-blue-600 text-xs">{formatCurrency(d.low)}</td>
                <td className="px-4 py-2.5 text-right text-red-400 text-xs">{formatCurrency(d.high)}</td>
                <td className={cn("px-4 py-2.5 text-right text-xs font-medium",trendColor(d.point,referencePrice))}>
                  {diff>0?"+":""}{formatCurrency(diff)} ({pct>0?"+":""}{pct.toFixed(1)}%)
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ForecastPage() {
  const [commodity, setCommodity] = useState("coconut");
  const [horizon, setHorizon]     = useState<HorizonKey>("7d");
  const [data, setData]           = useState<CommodityForecast|null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const { lang, t }               = useLang();

  const load = (slug: string, forceRefresh = false) => {
    if (forceRefresh) invalidateApi(`/forecast/${slug}/`);
    setLoading(true); setError(""); setData(null);
    fetchForecast(slug).then(setData).catch((e:Error)=>setError(e.message)).finally(()=>setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{ load(commodity); },[commodity]);

  const HORIZON_TABS = [
    { key:"1d"  as HorizonKey, label:t("tomorrow"),  icon:"📅" },
    { key:"7d"  as HorizonKey, label:t("next7Days"), icon:"📆" },
    { key:"30d" as HorizonKey, label:t("next30Days"),icon:"🗓️" },
  ];

  const cInfo    = COMMODITY_MAP[commodity];
  const hData    = data?.forecasts[horizon];
  const latestPx = data?.latest_price??0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🤖 {t("aiPriceForecastTitle")}</h1>
          <p className="text-gray-500 text-sm mt-1">{t("forecastSubtitle")}</p>
        </div>
        <button onClick={()=>load(commodity, true)} className="flex items-center gap-2 text-sm text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
          <RefreshCw size={13} className={loading?"animate-spin":""}/> {t("refresh")}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 shadow-sm">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t("selectCommodity")}</div>
        <div className="flex flex-wrap gap-2">
          {COMMODITIES.map((c)=>(
            <button key={c.id} onClick={()=>setCommodity(c.id)}
              className={cn("px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                commodity===c.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-300 hover:bg-indigo-50 hover:border-indigo-300")}>
              {c.icon} {tCommodity(c.id,lang)}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-red-700 text-sm">⚠️ {error}</div>}

      {loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 shadow-sm">
          <div className="text-4xl mb-3 animate-pulse">🤖</div>
          <div className="text-sm">{t("runningModel")}</div>
        </div>
      )}

      {data && !loading && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div className="bg-white rounded-xl border-2 border-indigo-400 p-4 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t("todayPrice")}</div>
              <div className="text-2xl font-bold text-indigo-700">{formatCurrency(latestPx)}</div>
              <div className="text-xs text-gray-400 mt-1">{t("asOf")} {data.latest_date}</div>
            </div>
            {(["1d","7d","30d"] as HorizonKey[]).map((hk,i)=>(
              <div key={hk} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{[t("tomorrow"),t("in7Days"),t("in30Days")][i]}</div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(data.forecasts[hk].point)}</div>
                <div className={cn("flex items-center gap-1 text-xs font-medium mt-1",trendColor(data.forecasts[hk].point,latestPx))}>
                  {trendIcon(data.forecasts[hk].point,latestPx)}
                  {((data.forecasts[hk].point-latestPx)/latestPx*100).toFixed(2)}%
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-5">
            <div className="flex border-b border-gray-200 px-5 pt-4 gap-1">
              {HORIZON_TABS.map((tab)=>(
                <button key={tab.key} onClick={()=>setHorizon(tab.key)}
                  className={cn("px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors",
                    horizon===tab.key ? "border-indigo-600 text-indigo-700 bg-indigo-50" : "border-transparent text-gray-500 hover:text-indigo-600")}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {hData && (
              <div className="p-5">
                <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <div className="text-sm text-gray-500 mb-0.5">{cInfo?.icon} <strong>{tCommodity(commodity,lang)}</strong> · {hData.label}</div>
                    <div className="text-3xl font-bold text-indigo-700">{formatCurrency(hData.point)}</div>
                    <div className="text-xs text-gray-500 mt-1">{t("forecastRange")} {formatCurrency(hData.low)} – {formatCurrency(hData.high)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",data.method==="gradient_boost"?"bg-indigo-100 text-indigo-700":"bg-amber-100 text-amber-700")}>
                      {data.method==="gradient_boost" ? t("gradientBoost") : t("ewmTrend")}
                    </span>
                    <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full",data.sufficient_data?"bg-green-100 text-green-700":"bg-amber-100 text-amber-700")}>
                      {data.data_points} {t("dataPoints")} · {data.sufficient_data ? t("fullML") : t("limitedData")}
                    </span>
                  </div>
                </div>

                {horizon!=="1d" && hData.daily && (
                  <ForecastChart latest_price={latestPx} latest_date={data.latest_date} horizon={hData} todayLabel={t("today")}/>
                )}

                {horizon==="1d" && (
                  <div className="flex items-center justify-center gap-6 py-8">
                    <div className="text-center"><div className="text-xs text-gray-500 mb-1">{t("lowerBound")}</div><div className="text-xl font-bold text-blue-600">{formatCurrency(hData.low)}</div></div>
                    <div className="text-center px-6 py-4 rounded-2xl border-2 border-indigo-400 bg-indigo-50">
                      <div className="text-xs text-gray-500 mb-1">{t("pointEstimate")}</div>
                      <div className="text-2xl font-bold text-indigo-700">{formatCurrency(hData.point)}</div>
                      <div className={cn("flex items-center justify-center gap-1 text-sm font-medium mt-1",trendColor(hData.point,latestPx))}>
                        {trendIcon(hData.point,latestPx)} {((hData.point-latestPx)/latestPx*100).toFixed(2)}% {t("vsToday")}
                      </div>
                    </div>
                    <div className="text-center"><div className="text-xs text-gray-500 mb-1">{t("upperBound")}</div><div className="text-xl font-bold text-red-400">{formatCurrency(hData.high)}</div></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {horizon!=="1d" && hData?.daily && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-800">{t("dailyForecast")}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{t("confidenceBand")}</p>
              </div>
              <DailyTable daily={hData.daily} referencePrice={latestPx} t={t}/>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 flex items-start gap-2">
            <Info size={14} className="flex-shrink-0 mt-0.5"/>
            <div>
              <strong>{t("forecastDisclaimer")}</strong>{" "}
              {t("forecastDisclaimerBody").replace("{0}", String(data.data_points))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
