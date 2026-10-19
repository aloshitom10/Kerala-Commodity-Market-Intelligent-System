"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, BarChart2, TrendingUp, Map, Lightbulb, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { type UserRole, ROLE_META } from "@/lib/data";
import { useLang } from "@/lib/i18n";
import KPLogo from "@/components/KPLogo";

export default function Navbar() {
  const pathname          = usePathname();
  const [open, setOpen]   = useState(false);
  const [role, setRole]   = useState<UserRole | null>(null);
  const { lang, setLang, t } = useLang();

  useEffect(() => {
    const stored = localStorage.getItem("userRole") as UserRole | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setRole(stored);
  }, []);

  const meta = role ? ROLE_META[role] : null;

  const NAV_LINKS = [
    { href: "/prices",     label: t("marketPrices"),       icon: BarChart2  },
    { href: "/trends",     label: t("trends"),              icon: TrendingUp },
    { href: "/comparison", label: t("districtComparison"),  icon: Map        },
    { href: "/insights",   label: t("marketInsights"),      icon: Lightbulb  },
    { href: "/forecast",   label: t("aiForecast"),          icon: TrendingUp },
    { href: "/search",     label: t("search"),              icon: Search     },
  ];

  const toggleLang = () => setLang(lang === "en" ? "ml" : "en");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-green-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <KPLogo size={36} />
          <div className="hidden sm:block">
            <div className="text-white font-bold text-base leading-tight tracking-tight">{t("appName")}</div>
            <div className="text-green-300 text-xs leading-tight">{t("appSub")}</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-green-600 text-white"
                  : "text-green-100 hover:bg-green-700 hover:text-white"
              )}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1 text-xs font-bold bg-green-700 hover:bg-green-600 text-green-100 px-2.5 py-1.5 rounded-full transition-colors border border-green-600"
            title={lang === "en" ? "Switch to Malayalam" : "Switch to English"}
          >
            {lang === "en" ? (
              <><span>🇮🇳</span> <span>മല</span></>
            ) : (
              <><span>🌐</span> <span>EN</span></>
            )}
          </button>

          {/* Role badge */}
          {meta && (
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 bg-green-700 hover:bg-green-600 px-3 py-1.5 rounded-full transition-colors"
            >
              <span className="text-sm">{meta.icon}</span>
              <span className="text-xs text-green-100 font-medium">
                {lang === "ml"
                  ? { farmer: "കർഷകൻ", trader: "വ്യാപാരി", cooperative: "കോ-ഓപ്പ്", consumer: "ഉപഭോക്താവ്" }[role as UserRole]
                  : meta.label}
              </span>
              <span className="text-xs text-green-400">· {t("changeRole")}</span>
            </Link>
          )}

          <button className="lg:hidden text-white p-2" onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="lg:hidden bg-green-900 border-t border-green-700 px-4 pb-4">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium mt-1 transition-colors",
                pathname === href
                  ? "bg-green-600 text-white"
                  : "text-green-200 hover:bg-green-700 hover:text-white"
              )}
            >
              <Icon size={16} />{label}
            </Link>
          ))}
          {/* Language toggle in mobile */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium mt-1 text-green-200 hover:bg-green-700 w-full"
          >
            {lang === "en" ? "🇮🇳 മലയാളം" : "🌐 English"}
          </button>
          {meta && (
            <Link href="/" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium mt-2 bg-green-800 text-green-200"
            >
              <span>{meta.icon}</span> {t("viewingAs")} {meta.label} · {t("changeRole")}
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
