"use client";
import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { COMMODITIES, DISTRICTS, fetchPriceTrends, type APIPriceTrendPoint } from "@/lib/data";
import { formatCurrency, cn } from "@/lib/utils";
import { useLang, tCommodity, tDistrict } from "@/lib/i18n";

const PERIODS = [{ label: "7D", days: 7 }, { label: "14D", days: 14 }, { label: "30D", days: 30 }];
const CHART_TYPES = ["Line", "Bar"] as const;

function daysAgo(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split("T")[0];
}

export default function TrendsPage() {
  const [commodity, setCommodity] = useState("coconut");
  const [district, setDistrict]   = useState("");
  const [period, setPeriod]       = useState(30);
  const [chartType, setChartType] = useState<"Line" | "Bar">("Line");
  const [data, setData]           = useState<APIPriceTrendPoint[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const { lang, t }               = useLang();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");
    fetchPriceTrends(commodity, daysAgo(period), daysAgo(0), district || undefined)
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [commodity, district, period]);

  const chartData = data.map((d) => ({
    date: d.price_date.slice(5),
    fullDate: d.price_date,
    price: parseFloat(d.avg_price),
    min:   parseFloat(d.min_price),
    max:   parseFloat(d.max_price),
  }));

  const avgPrice = chartData.length ? chartData.reduce((s, d) => s + d.price, 0) / chartData.length : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📈 {t("historicalPriceTrends")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("dailyWholesale")}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{t("commodity")}</label>
            <select value={commodity} onChange={(e) => setCommodity(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              {COMMODITIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {tCommodity(c.id, lang)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{t("districtOptional")}</label>
            <select value={district} onChange={(e) => setDistrict(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">{t("allDistricts")}</option>
              {DISTRICTS.map((d) => <option key={d} value={d}>{tDistrict(d, lang)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{t("period")}</label>
            <div className="flex gap-1">
              {PERIODS.map((p) => (
                <button key={p.label} onClick={() => setPeriod(p.days)}
                  className={cn("flex-1 py-2.5 text-sm font-medium rounded-lg border transition-colors",
                    period === p.days ? "bg-green-700 text-white border-green-700" : "border-gray-300 text-gray-600 hover:bg-gray-50")}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{t("chartType")}</label>
            <div className="flex gap-1">
              {CHART_TYPES.map((tp) => (
                <button key={tp} onClick={() => setChartType(tp)}
                  className={cn("flex-1 py-2.5 text-sm font-medium rounded-lg border transition-colors",
                    chartType === tp ? "bg-green-700 text-white border-green-700" : "border-gray-300 text-gray-600 hover:bg-gray-50")}>
                  {tp}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">⚠️ {error}</div>}

      {!loading && chartData.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: t("latestPrice"), value: formatCurrency(chartData[chartData.length - 1]?.price ?? 0), color: "text-green-700" },
            { label: t("periodHigh"),  value: formatCurrency(Math.max(...chartData.map((d) => d.max))),     color: "text-red-500"   },
            { label: t("periodLow"),   value: formatCurrency(Math.min(...chartData.map((d) => d.min))),     color: "text-blue-600"  },
            { label: t("periodAvg"),   value: formatCurrency(avgPrice),                                     color: "text-orange-500"},
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</div>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800">
            {COMMODITY_MAP_ICON[commodity]} {tCommodity(commodity, lang)} — {t("priceTrend")} ({period}D)
            {district && ` · ${tDistrict(district, lang)}`}
          </h2>
          <div className="text-xs text-gray-500">{chartData.length} {t("dataPoints")}</div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400">{t("loadingChart")}</div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400">{t("noDataPeriod")}</div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            {chartType === "Line" ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tickFormatter={(v) => `₹${v.toLocaleString()}`} tick={{ fontSize: 11 }} width={70} />
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), ""]} labelFormatter={(l) => `Date: ${l}`} />
                <Legend />
                <Line type="monotone" dataKey="max"   name={t("high")}  stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="price" name={t("avgPrice")} stroke="#15803d" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="min"   name={t("low")}   stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tickFormatter={(v) => `₹${v.toLocaleString()}`} tick={{ fontSize: 11 }} width={70} />
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), ""]} labelFormatter={(l) => `Date: ${l}`} />
                <Legend />
                <Bar dataKey="price" name={t("avgPrice")} fill="#15803d" radius={[2, 2, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {!loading && chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">{t("priceHistoryTable")}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3">{t("date")}</th>
                  <th className="text-right px-5 py-3">{t("avgPrice")}</th>
                  <th className="text-right px-5 py-3">{t("low")}</th>
                  <th className="text-right px-5 py-3">{t("high")}</th>
                </tr>
              </thead>
              <tbody>
                {[...chartData].reverse().slice(0, 20).map((row) => (
                  <tr key={row.fullDate} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-600">{new Date(row.fullDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className="px-5 py-3 text-right font-bold text-gray-900">{formatCurrency(row.price)}</td>
                    <td className="px-5 py-3 text-right text-blue-600">{formatCurrency(row.min)}</td>
                    <td className="px-5 py-3 text-right text-red-500">{formatCurrency(row.max)}</td>
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

// small helper to avoid importing COMMODITY_MAP just for icon
import { COMMODITY_MAP as _CM } from "@/lib/data";
const COMMODITY_MAP_ICON: Record<string, string> = Object.fromEntries(
  Object.entries(_CM).map(([k, v]) => [k, v.icon])
);
