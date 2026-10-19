"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import KPLogo from "@/components/KPLogo";
import {
  COMMODITIES, COMMODITY_MAP, ROLE_META, ROLE_COMMODITIES,
  fetchInsights, fetchSourceInfo,
  type UserRole, type APIInsight, type APISourceInfo,
} from "@/lib/data";
import { cachedFetch } from "@/lib/cache";
import { formatCurrency, cn } from "@/lib/utils";
import { useLang, tCommodity } from "@/lib/i18n";

const ROLE_FEATURES_EN = {
  farmer:      { title: "Your Market View",       features: ["farmerF1","farmerF2","farmerF3","farmerF4"] },
  trader:      { title: "Trading Intelligence",   features: ["traderF1","traderF2","traderF3","traderF4"] },
  cooperative: { title: "Procurement Dashboard",  features: ["coopF1","coopF2","coopF3","coopF4"]       },
  consumer:    { title: "Today's Market Prices",  features: ["consF1","consF2","consF3","consF4"]        },
} as const;

const ROLE_TITLE_ML: Record<UserRole, string> = {
  farmer:      "നിങ്ങളുടെ വിപണി കാഴ്ചപ്പാട്",
  trader:      "ട്രേഡിംഗ് ഇന്റലിജൻസ്",
  cooperative: "സംഭരണ ​​ഡാഷ്‌ബോർഡ്",
  consumer:    "ഇന്നത്തെ വിപണി വിലകൾ",
};

export default function HomePage() {
  const [role, setRole]           = useState<UserRole | null>(null);
  const [insights, setInsights]   = useState<APIInsight[]>([]);
  const [sourceInfo, setSourceInfo] = useState<APISourceInfo | null>(null);
  const [mounted, setMounted]     = useState(false);
  const { lang, t }               = useLang();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const stored = localStorage.getItem("userRole") as UserRole | null;
    if (stored) setRole(stored);

    // Use cachedFetch directly so stale session data renders immediately
    // while a fresh fetch runs in the background.
    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
    cachedFetch(
      `${API_BASE}/insights/`,
      () => fetchInsights(),
      (stale) => { setInsights((stale as Awaited<ReturnType<typeof fetchInsights>>).insights); },
    ).then((ins) => setInsights(ins.insights)).catch(() => {});

    cachedFetch(
      `${API_BASE}/source/`,
      () => fetchSourceInfo(),
      (stale) => { setSourceInfo(stale as APISourceInfo); },
    ).then((src) => setSourceInfo(src)).catch(() => {});
  }, []);

  const handleRoleSelect = (r: UserRole) => {
    setRole(r);
    localStorage.setItem("userRole", r);
  };
  const handleClearRole = () => { setRole(null); localStorage.removeItem("userRole"); };

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-center py-20 text-gray-400 text-sm">{t("loadingPlatform")}</div>
      </div>
    );
  }

  // ── Role not selected ──────────────────────────────────────────────────────
  if (!role) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-3"><KPLogo size={64} /></div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("heroTitle")}</h1>
          <p className="text-gray-500 text-base max-w-xl mx-auto">{t("heroSub")}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-800 text-center mb-2">{t("whoAreYou")}</h2>
          <p className="text-gray-500 text-sm text-center mb-6">{t("selectRoleSub")}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.entries(ROLE_META) as [UserRole, typeof ROLE_META[UserRole]][]).map(([r, meta]) => (
              <button
                key={r}
                onClick={() => handleRoleSelect(r)}
                className={cn("flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all hover:shadow-md", meta.bg)}
              >
                <div className="text-4xl">{meta.icon}</div>
                <div className={`font-bold text-base ${meta.color}`}>
                  {lang === "ml"
                    ? { farmer:"കർഷകൻ", trader:"വ്യാപാരി", cooperative:"കോ-ഓപ്പറേറ്റീവ്", consumer:"ഉപഭോക്താവ്" }[r]
                    : meta.label}
                </div>
                <div className="text-xs text-gray-500 text-center leading-relaxed">
                  {lang === "ml"
                    ? { farmer:"മികച്ച വിലകൾ, വിപണി ട്രെൻഡുകൾ & എവിടെ വിൽക്കണം", trader:"വില വ്യത്യാസങ്ങൾ, ആർബിട്രേജ് & ദൈനംദിന ചലനങ്ങൾ", cooperative:"വിപണി അവലോകനം, സംഭരണ ​​ഇന്റലിജൻസ് & ട്രെൻഡുകൾ", consumer:"ലളിതമായ വില വിവരങ്ങൾ & ഏറ്റവും നല്ല നിരക്കുകൾ" }[r]
                    : meta.desc}
                </div>
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">{t("changeRoleAnytime")}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t("commodities"), value: COMMODITIES.length, icon: "🛒" },
            { label: t("districts"),   value: 14,                  icon: "🗺️" },
            { label: t("markets"),     value: "30+",               icon: "🏪" },
            { label: t("updated"),     value: t("daily"),          icon: "🔄" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
              <div className="text-3xl mb-1">{icon}</div>
              <div className="text-2xl font-bold text-green-700">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Role selected dashboard ────────────────────────────────────────────────
  const meta         = ROLE_META[role];
  const featureKeys  = ROLE_FEATURES_EN[role].features;
  const relevantIds  = ROLE_COMMODITIES[role];
  const displayInsights = insights.filter((i) => relevantIds.includes(i.commodity_slug)).slice(0, role === "consumer" ? 4 : 8);
  const roleTitle    = lang === "ml" ? ROLE_TITLE_ML[role] : ROLE_FEATURES_EN[role].title;

  const quickCards = [
    { href: "/prices",     icon: "📊", titleKey: role === "farmer" ? "checkTodayPrices" : "priceDashboard",   descKey: "priceDashboardDesc",   color: "border-green-200 hover:bg-green-50"   },
    { href: "/trends",     icon: "📈", titleKey: "historicalTrends",                                           descKey: "historicalTrendsDesc", color: "border-blue-200 hover:bg-blue-50"     },
    { href: "/comparison", icon: "🗺️", titleKey: role === "trader" ? "marketArbitrage" : "districtComparison",descKey: "districtCompDesc",     color: "border-orange-200 hover:bg-orange-50" },
    { href: "/insights",   icon: "💡", titleKey: role === "farmer" ? "sellingAdvice" : "marketInsights",       descKey: "marketInsightsDesc",   color: "border-purple-200 hover:bg-purple-50" },
    { href: "/forecast",   icon: "🤖", titleKey: "aiPriceForecast",                                            descKey: "aiPriceForecastDesc",  color: "border-indigo-200 hover:bg-indigo-50" },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Role banner */}
      <div className={cn("rounded-2xl border-2 p-6 mb-6 flex items-start justify-between gap-4", meta.bg)}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-3xl">{meta.icon}</span>
            <h1 className={`text-2xl font-bold ${meta.color}`}>{roleTitle}</h1>
          </div>
          <p className="text-gray-600 text-sm mb-3">
            {lang === "ml"
              ? { farmer:"മികച്ച വിലകൾ, വിപണി ട്രെൻഡുകൾ & എവിടെ വിൽക്കണം", trader:"വില വ്യത്യാസങ്ങൾ, ആർബിട്രേജ് & ദൈനംദിന ചലനങ്ങൾ", cooperative:"വിപണി അവലോകനം, സംഭരണ ​​ഇന്റലിജൻസ് & ട്രെൻഡുകൾ", consumer:"ലളിതമായ വില വിവരങ്ങൾ & ഏറ്റവും നല്ല നിരക്കുകൾ" }[role]
              : meta.desc}
          </p>
          <ul className="space-y-1">
            {featureKeys.map((k) => (
              <li key={k} className="text-sm text-gray-700">{t(k as Parameters<typeof t>[0])}</li>
            ))}
          </ul>
        </div>
        <button
          onClick={handleClearRole}
          className="flex-shrink-0 text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg bg-white transition-colors"
        >
          {t("changeRole")}
        </button>
      </div>

      {/* Source bar */}
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-6 flex items-center justify-between shadow-sm text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
          <span>{t("livePrices")}</span>
        </div>
        {sourceInfo && (
          <a href={sourceInfo.source_url} target="_blank" rel="noreferrer"
            className="text-xs text-green-700 underline flex items-center gap-1 hover:text-green-900">
            {sourceInfo.source_name} <ExternalLink size={10} />
          </a>
        )}
      </div>

      {/* Price movers */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-800">
            {role === "consumer" ? t("todaysPrices") : t("todaysPriceMoves")}
            {sourceInfo?.last_updated && (
              <span className="text-xs font-normal text-gray-400 ml-2">
                · {new Date(sourceInfo.last_updated).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
            )}
          </h2>
          <Link href="/prices" className="text-green-600 text-sm font-medium hover:underline flex items-center gap-1">
            {t("fullDashboard")} <ArrowRight size={14} />
          </Link>
        </div>
        {displayInsights.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {COMMODITIES.filter((c) => relevantIds.includes(c.id)).slice(0, 5).map((c) => (
              <Link href={`/prices?commodity=${c.id}`} key={c.id}>
                <div className="bg-gray-50 rounded-lg p-3 hover:bg-green-50 transition-colors border border-gray-100 cursor-pointer">
                  <div className="text-2xl mb-1">{c.icon}</div>
                  <div className="text-xs text-gray-500 mb-0.5">{tCommodity(c.id, lang)}</div>
                  <div className="text-xs text-gray-400">{t("loading")}</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {displayInsights.map((m) => {
              const cInfo = COMMODITY_MAP[m.commodity_slug];
              const chg   = m.change_pct;
              return (
                <Link href={`/prices?commodity=${m.commodity_slug}`} key={m.commodity_id}>
                  <div className="bg-gray-50 rounded-lg p-3 hover:bg-green-50 transition-colors border border-gray-100 cursor-pointer">
                    <div className="text-2xl mb-1">{cInfo?.icon ?? "🌿"}</div>
                    <div className="text-xs text-gray-500 mb-0.5 truncate">{tCommodity(m.commodity_slug, lang)}</div>
                    <div className="font-bold text-gray-900 text-sm">{formatCurrency(parseFloat(m.avg_price))}</div>
                    <div className={cn("flex items-center gap-0.5 text-xs font-medium mt-0.5",
                      chg == null ? "text-gray-400" : chg > 0 ? "text-green-600" : chg < 0 ? "text-red-500" : "text-gray-500"
                    )}>
                      {chg == null ? <Minus size={10} /> : chg > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {chg != null ? `${chg > 0 ? "+" : ""}${chg.toFixed(1)}%` : "—"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {quickCards.map(({ href, icon, titleKey, descKey, color }) => (
          <Link key={href} href={href}>
            <div className={cn("bg-white rounded-xl border p-4 transition-colors cursor-pointer shadow-sm", color)}>
              <div className="text-2xl mb-2">{icon}</div>
              <div className="font-semibold text-gray-800 text-sm mb-1">{t(titleKey)}</div>
              <div className="text-xs text-gray-500">{t(descKey)}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Data note */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 flex items-start gap-2">
        <span className="text-base">ℹ️</span>
        <div>
          <strong className="text-gray-700">{t("dataSource")}</strong>{" "}
          <a href="https://www.ecostat.kerala.gov.in/mi-prices-dashboard" target="_blank" rel="noreferrer" className="text-green-700 underline">
            Kerala DES — Market Intelligence
          </a>
          {" "}· {t("dataSourceDesc")}
          {sourceInfo?.last_updated && ` ${t("lastData")} ${new Date(sourceInfo.last_updated).toLocaleDateString("en-IN")}.`}
        </div>
      </div>
    </div>
  );
}
