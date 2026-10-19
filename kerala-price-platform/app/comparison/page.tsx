"use client";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Trophy, ArrowDownToLine } from "lucide-react";
import { COMMODITIES, COMMODITY_MAP, fetchDistrictComparison, type APIDistrictComparison } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { useLang, tCommodity, tDistrict } from "@/lib/i18n";

const COLORS = ["#15803d","#16a34a","#22c55e","#4ade80","#86efac","#bbf7d0","#dcfce7","#f0fdf4","#fef9c3","#fef08a","#fde047","#facc15","#f59e0b","#f97316","#ef4444"];

export default function ComparisonPage() {
  const [commodity, setCommodity] = useState("coconut");
  const [data, setData]           = useState<APIDistrictComparison[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [priceDate, setPriceDate] = useState("");
  const { lang, t }               = useLang();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");
    fetchDistrictComparison(commodity)
      .then((r) => { setData([...r.results].sort((a,b)=>parseFloat(b.avg_price)-parseFloat(a.avg_price))); setPriceDate(r.date??""); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [commodity]);

  const highest  = data[0];
  const lowest   = data[data.length - 1];
  const avgPrice = data.length ? data.reduce((s,d)=>s+parseFloat(d.avg_price),0)/data.length : 0;
  const spread   = highest && lowest ? (((parseFloat(highest.avg_price)-parseFloat(lowest.avg_price))/parseFloat(lowest.avg_price))*100).toFixed(1) : "0";

  const chartData = data.map((d,i) => ({
    district: d.district.length>12 ? d.district.slice(0,12)+"…" : d.district,
    fullDistrict: d.district, price: parseFloat(d.avg_price),
    min: parseFloat(d.min_price), max: parseFloat(d.max_price),
    centres: d.centre_count, color: COLORS[i%COLORS.length],
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🗺️ {t("districtWiseComparison")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("compareWholesale")}{priceDate && ` · ${new Date(priceDate).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}`}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">{t("selectCommodity")}</label>
        <div className="flex flex-wrap gap-2">
          {COMMODITIES.map((c) => (
            <button key={c.id} onClick={() => setCommodity(c.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${commodity===c.id ? "bg-green-700 text-white border-green-700" : "bg-white text-gray-600 border-gray-300 hover:bg-green-50"}`}>
              {c.icon} {tCommodity(c.id, lang)}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">⚠️ {error}</div>}

      {!loading && data.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2"><Trophy size={14} className="text-yellow-500" />{t("highestPrice")}</div>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(parseFloat(highest?.avg_price??"0"))}</div>
            <div className="text-sm text-gray-600 mt-1">{tDistrict(highest?.district??"—", lang)}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2"><ArrowDownToLine size={14} className="text-blue-500" />{t("lowestPrice")}</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(parseFloat(lowest?.avg_price??"0"))}</div>
            <div className="text-sm text-gray-600 mt-1">{tDistrict(lowest?.district??"—", lang)}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t("stateAverage")}</div>
            <div className="text-2xl font-bold text-orange-500">{formatCurrency(avgPrice)}</div>
            <div className="text-sm text-gray-600 mt-1">{data.length} {t("districts")}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t("priceSpread")}</div>
            <div className="text-2xl font-bold text-purple-600">{spread}%</div>
            <div className="text-sm text-gray-600 mt-1">{t("highVsLow")}</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
        <h2 className="font-bold text-gray-800 mb-4">{COMMODITY_MAP[commodity]?.icon} {tCommodity(commodity, lang)} — {t("avgPriceByDistrict")}</h2>
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400">{t("loading")}</div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400">{t("noData")}</div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{top:5,right:10,bottom:40,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="district" tick={{fontSize:10}} angle={-35} textAnchor="end" interval={0} />
              <YAxis tickFormatter={(v)=>`₹${v.toLocaleString()}`} tick={{fontSize:11}} width={70} />
              <Tooltip formatter={(v,name)=>[formatCurrency(Number(v)),String(name)]} labelFormatter={(l)=>chartData.find(d=>d.district===l)?.fullDistrict??l} />
              <Bar dataKey="price" name={t("avgPrice")} radius={[4,4,0,0]}>
                {chartData.map((entry) => <Cell key={entry.fullDistrict} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {!loading && data.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100"><h2 className="font-bold text-gray-800">{t("districtPriceDetails")}</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3">{t("rank")}</th>
                  <th className="text-left px-5 py-3">{t("district")}</th>
                  <th className="text-right px-5 py-3">{t("avgPrice")}</th>
                  <th className="text-right px-5 py-3">{t("min")}</th>
                  <th className="text-right px-5 py-3">{t("max")}</th>
                  <th className="text-right px-5 py-3">{t("centres")}</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((d,i) => (
                  <tr key={d.fullDistrict} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-400 font-medium">#{i+1}</td>
                    <td className="px-5 py-3 font-medium text-gray-800">
                      <span className="inline-block w-3 h-3 rounded-full mr-2 align-middle" style={{background:d.color}} />
                      {tDistrict(d.fullDistrict, lang)}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-gray-900">{formatCurrency(d.price)}</td>
                    <td className="px-5 py-3 text-right text-blue-600">{formatCurrency(d.min)}</td>
                    <td className="px-5 py-3 text-right text-red-500">{formatCurrency(d.max)}</td>
                    <td className="px-5 py-3 text-right text-gray-500">{d.centres}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
