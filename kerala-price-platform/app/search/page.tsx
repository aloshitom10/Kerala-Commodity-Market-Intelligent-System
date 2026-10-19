"use client";
import { useState, useEffect } from "react";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import { COMMODITIES, COMMODITY_MAP, DISTRICTS, fetchPriceList, fetchCentres, type APIMarketPrice } from "@/lib/data";
import { formatCurrency, cn } from "@/lib/utils";
import { useLang, tCommodity, tDistrict } from "@/lib/i18n";

type SortKey = "price"|"date"|"commodity"|"district";
type SortDir = "asc"|"desc";

function SortArrow({ sortKey, k }: { sortKey: SortKey; k: SortKey }) {
  return <ArrowUpDown size={12} className={sortKey===k?"text-green-600":"text-gray-400"} />;
}

export default function SearchPage() {
  const [query, setQuery]     = useState("");
  const [commodity, setCommodity] = useState("");
  const [district, setDistrict]   = useState("");
  const [centre, setCentre]       = useState("");
  const [fromDate, setFromDate]   = useState("");
  const [toDate, setToDate]       = useState("");
  const [sortKey, setSortKey]     = useState<SortKey>("date");
  const [sortDir, setSortDir]     = useState<SortDir>("desc");
  const [centres, setCentres]     = useState<string[]>([]);
  const [results, setResults]     = useState<APIMarketPrice[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [searched, setSearched]   = useState(false);
  const { lang, t }               = useLang();

  useEffect(() => {
    if (district) { fetchCentres(district).then((d)=>setCentres(d.centres)).catch(()=>setCentres([])); }
    else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCentres([]);
      setCentre("");
    }
  }, [district]);

  const handleSearch = () => {
    setLoading(true); setError(""); setSearched(true);
    fetchPriceList({ commodity:commodity||undefined, district:district||undefined, centre:centre||undefined, from_date:fromDate||undefined, to_date:toDate||undefined })
      .then((d)=>setResults(d.results??[]))
      .catch((e)=>setError(e.message))
      .finally(()=>setLoading(false));
  };

  const filtered = results.filter((r) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return r.commodity_name.toLowerCase().includes(q) || r.district.toLowerCase().includes(q) || r.market_centre.toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a,b)=>{
    let cmp=0;
    if (sortKey==="price") cmp=parseFloat(a.price)-parseFloat(b.price);
    else if (sortKey==="date") cmp=a.price_date.localeCompare(b.price_date);
    else if (sortKey==="commodity") cmp=a.commodity_name.localeCompare(b.commodity_name);
    else if (sortKey==="district") cmp=a.district.localeCompare(b.district);
    return sortDir==="asc"?cmp:-cmp;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey===key) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🔎 {t("searchFilterPrices")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("searchWholesale")}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{t("commodity")}</label>
            <select value={commodity} onChange={(e)=>setCommodity(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">{t("allCommodities")}</option>
              {COMMODITIES.map((c)=><option key={c.id} value={c.id}>{c.icon} {tCommodity(c.id,lang)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{t("district")}</label>
            <select value={district} onChange={(e)=>setDistrict(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">{t("allDistricts")}</option>
              {DISTRICTS.map((d)=><option key={d} value={d}>{tDistrict(d,lang)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{t("marketCentre")}</label>
            <select value={centre} onChange={(e)=>setCentre(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" disabled={!district}>
              <option value="">{t("allCentres")}</option>
              {centres.map((c)=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{t("fromDate")}</label>
            <input type="date" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{t("toDate")}</label>
            <input type="date" value={toDate} onChange={(e)=>setToDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="flex items-end">
            <button onClick={handleSearch} className="w-full flex items-center justify-center gap-2 bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors">
              <Search size={16} /> {t("searchBtn")}
            </button>
          </div>
        </div>
        {searched && results.length>0 && (
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder={t("filterResults")} value={query} onChange={(e)=>setQuery(e.target.value)} className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">⚠️ {error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">
            {searched ? `${sorted.length} ${t("results")}` : t("setFilters")}
          </h2>
          {sorted.length>0 && <div className="text-xs text-gray-500 flex items-center gap-1"><Filter size={12}/>{t("clickToSort")}</div>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3 cursor-pointer hover:text-green-700" onClick={()=>toggleSort("commodity")}><div className="flex items-center gap-1">{t("commodity")} <SortArrow sortKey={sortKey} k="commodity"/></div></th>
                <th className="text-left px-5 py-3 cursor-pointer hover:text-green-700" onClick={()=>toggleSort("district")}><div className="flex items-center gap-1">{t("district")} <SortArrow sortKey={sortKey} k="district"/></div></th>
                <th className="text-left px-5 py-3">{t("marketCentre")}</th>
                <th className="text-left px-5 py-3 cursor-pointer hover:text-green-700" onClick={()=>toggleSort("date")}><div className="flex items-center gap-1">{t("date")} <SortArrow sortKey={sortKey} k="date"/></div></th>
                <th className="text-right px-5 py-3 cursor-pointer hover:text-green-700" onClick={()=>toggleSort("price")}><div className="flex items-center justify-end gap-1">{t("currentPrice")} <SortArrow sortKey={sortKey} k="price"/></div></th>
                <th className="text-right px-5 py-3">{t("prevDay")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">{t("searching")}</td></tr>
              ) : !searched ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">{t("setFilters")}</td></tr>
              ) : sorted.length===0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">{t("noResults")}</td></tr>
              ) : sorted.slice(0,200).map((r)=>{
                const cInfo = COMMODITY_MAP[r.commodity_slug];
                const price = parseFloat(r.price);
                const prev  = r.prev_day_price ? parseFloat(r.prev_day_price) : null;
                const chg   = price&&prev ? ((price-prev)/prev)*100 : null;
                const chgColor = chg==null?"text-gray-400":chg>0?"text-green-600":chg<0?"text-red-500":"text-gray-400";
                return (
                  <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3"><div className="flex items-center gap-1.5"><span>{cInfo?.icon??"🌿"}</span><span className="font-medium">{tCommodity(r.commodity_slug,lang)}</span></div></td>
                    <td className="px-5 py-3 text-gray-600">{tDistrict(r.district,lang)}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{r.market_centre}</td>
                    <td className="px-5 py-3 text-gray-600">{new Date(r.price_date).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</td>
                    <td className="px-5 py-3 text-right font-bold text-gray-900">{formatCurrency(price)}</td>
                    <td className={cn("px-5 py-3 text-right text-xs",chgColor)}>{prev?(<>{formatCurrency(prev)}{chg!=null&&` (${chg>0?"+":""}${chg.toFixed(1)}%)`}</>):"—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {sorted.length>200 && (
          <div className="px-5 py-3 text-xs text-gray-500 border-t border-gray-100">{t("showingFirst")} {sorted.length} {t("useMoreFilters")}</div>
        )}
      </div>
    </div>
  );
}
