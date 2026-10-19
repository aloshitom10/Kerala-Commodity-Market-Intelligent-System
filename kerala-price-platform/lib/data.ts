// ─── Kerala Commodity Price Intelligence Platform ──────────────────────────
// Shared types, constants, and API client for all pages.
import { cachedFetch, invalidate } from "@/lib/cache";

export type UserRole = "farmer" | "trader" | "cooperative" | "consumer";

export const ROLE_META: Record<UserRole, { label: string; icon: string; color: string; bg: string; desc: string }> = {
  farmer:      { label: "Farmer",      icon: "🌾", color: "text-green-700",  bg: "bg-green-50 border-green-300",  desc: "Best prices, market trends & which market to sell at" },
  trader:      { label: "Trader",      icon: "📦", color: "text-blue-700",   bg: "bg-blue-50 border-blue-300",    desc: "Price spreads, arbitrage opportunities & daily movements" },
  cooperative: { label: "Cooperative", icon: "🤝", color: "text-purple-700", bg: "bg-purple-50 border-purple-300", desc: "Market overview, procurement intelligence & trends" },
  consumer:    { label: "Consumer",    icon: "🛒", color: "text-orange-700", bg: "bg-orange-50 border-orange-300", desc: "Simple price information & where to find the best rates" },
};

// Canonical commodity list — matches backend slugs
export const COMMODITIES = [
  { id: "rubber",       name: "Rubber",       icon: "🌿", category: "Plantation" },
  { id: "coconut",      name: "Coconut",       icon: "🥥", category: "Plantation" },
  { id: "arecanut",     name: "Arecanut",      icon: "🌴", category: "Plantation" },
  { id: "cocoa",        name: "Cocoa",         icon: "🍫", category: "Plantation" },
  { id: "coffee",       name: "Coffee",        icon: "☕", category: "Plantation" },
  { id: "nutmeg",       name: "Nutmeg",        icon: "🫚", category: "Spices"     },
  { id: "black-pepper", name: "Black Pepper",  icon: "⚫", category: "Spices"     },
  { id: "cardamom",     name: "Cardamom",      icon: "🌱", category: "Spices"     },
  { id: "ginger",       name: "Ginger",        icon: "🫚", category: "Spices"     },
  { id: "turmeric",     name: "Turmeric",      icon: "🟡", category: "Spices"     },
  { id: "cloves",       name: "Cloves",        icon: "🌿", category: "Spices"     },
  { id: "cinnamon",     name: "Cinnamon",      icon: "🪵", category: "Spices"     },
  { id: "banana",       name: "Banana",        icon: "🍌", category: "Fruits"     },
];

export const COMMODITY_MAP: Record<string, typeof COMMODITIES[0]> = Object.fromEntries(
  COMMODITIES.map((c) => [c.id, c])
);

export const DISTRICTS = [
  "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha",
  "Kottayam", "Idukki", "Ernakulam", "Thrissur",
  "Palakkad", "Malappuram", "Kozhikode", "Wayanad",
  "Kannur", "Kasaragod",
];

// ─── API base URL ─────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v));
  }
  const urlStr = url.toString();
  return cachedFetch<T>(urlStr, async () => {
    const res = await fetch(urlStr, { cache: "no-store" });
    if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
    return res.json() as Promise<T>;
  });
}

/** Force-refresh a specific API path (clears both memory & session cache). */
export function invalidateApi(path: string): void {
  invalidate(path);
}

// ─── API response types ───────────────────────────────────────────────────────

export type APICommodity = {
  id: number;
  slug: string;
  name: string;
  category: string;
  is_active: boolean;
};

export type APIMarketPrice = {
  id: number;
  price_date: string;
  district: string;
  market_centre: string;
  commodity: number;
  commodity_name: string;
  commodity_slug: string;
  price: string;
  price_unit: string;
  prev_day_price: string | null;
  prev_month_price: string | null;
  prev_year_price: string | null;
};

export type APIPriceSummaryItem = {
  commodity_id: number;
  commodity_name: string;
  commodity_slug: string;
  commodity_category: string;
  min_price: string;
  max_price: string;
  avg_price: string;
  market_count: number;
};

export type APIPriceTrendPoint = {
  price_date: string;
  avg_price: string;
  min_price: string;
  max_price: string;
};

export type APIDistrictComparison = {
  district: string;
  avg_price: string;
  min_price: string;
  max_price: string;
  centre_count: number;
};

export type APIInsight = {
  commodity_id: number;
  commodity_name: string;
  commodity_slug: string;
  commodity_category: string;
  avg_price: string;
  min_price: string;
  max_price: string;
  prev_avg_price: string | null;
  change_pct: number | null;
};

export type APISourceInfo = {
  source_name: string;
  source_url: string;
  last_updated: string | null;
  last_ingestion: {
    run_at: string;
    status: string;
    rows_inserted: number;
    rows_updated: number;
  } | null;
};

// ─── API functions ────────────────────────────────────────────────────────────

export async function fetchCommodities(): Promise<APICommodity[]> {
  const data = await apiFetch<{ results: APICommodity[] }>("/commodities/");
  return data.results ?? [];
}

export async function fetchPriceSummary(date?: string, district?: string): Promise<{
  date: string;
  results: APIPriceSummaryItem[];
}> {
  return apiFetch("/prices/summary/", {
    ...(date ? { date } : {}),
    ...(district ? { district } : {}),
  });
}

export async function fetchLatestPrices(commodity?: string): Promise<{
  latest_date: string;
  count: number;
  results: APIMarketPrice[];
}> {
  return apiFetch("/prices/latest/", commodity ? { commodity } : {});
}

export async function fetchPriceTrends(
  commodity: string,
  fromDate: string,
  toDate: string,
  district?: string
): Promise<{ commodity: string; from_date: string; to_date: string; data: APIPriceTrendPoint[] }> {
  return apiFetch("/prices/trends/", {
    commodity,
    from_date: fromDate,
    to_date: toDate,
    ...(district ? { district } : {}),
  });
}

export async function fetchDistrictComparison(commodity: string, date?: string): Promise<{
  commodity: string;
  date: string;
  results: APIDistrictComparison[];
}> {
  return apiFetch("/comparison/districts/", {
    commodity,
    ...(date ? { date } : {}),
  });
}

export async function fetchInsights(): Promise<{
  latest_date: string;
  prev_date: string;
  insights: APIInsight[];
}> {
  return apiFetch("/insights/");
}

export async function fetchSourceInfo(): Promise<APISourceInfo> {
  return apiFetch("/source/");
}

export async function fetchDistricts(): Promise<{ districts: string[] }> {
  return apiFetch("/districts/");
}

export async function fetchCentres(district?: string): Promise<{ centres: string[] }> {
  return apiFetch("/centres/", district ? { district } : {});
}

// ─── Forecasting types & API ──────────────────────────────────────────────────

export type ForecastDay = {
  date: string;
  point: number;
  low: number;
  high: number;
};

export type ForecastHorizon = {
  label: string;       // "Tomorrow" | "Next 7 Days" | "Next 30 Days"
  days: number;
  point: number;
  low: number;
  high: number;
  daily?: ForecastDay[];
};

export type CommodityForecast = {
  commodity: string;
  latest_date: string;
  latest_price: number;
  method: "gradient_boost" | "ewm";
  data_points: number;
  sufficient_data: boolean;
  forecasts: {
    "1d": ForecastHorizon;
    "7d": ForecastHorizon;
    "30d": ForecastHorizon;
  };
  error?: string;
};

export async function fetchForecast(commodity: string): Promise<CommodityForecast> {
  return apiFetch(`/forecast/${commodity}/`);
}

export async function fetchAllForecasts(): Promise<Record<string, CommodityForecast>> {
  return apiFetch("/forecast/");
}

export async function fetchPriceList(params: {
  commodity?: string;
  district?: string;
  centre?: string;
  from_date?: string;
  to_date?: string;
}): Promise<{ count: number; results: APIMarketPrice[] }> {
  const p: Record<string, string> = {};
  if (params.commodity) p.commodity = params.commodity;
  if (params.district) p.district = params.district;
  if (params.centre) p.centre = params.centre;
  if (params.from_date) p.from_date = params.from_date;
  if (params.to_date) p.to_date = params.to_date;
  return apiFetch("/prices/", p);
}

// ─── Role-to-commodity relevance mapping ─────────────────────────────────────
export const ROLE_COMMODITIES: Record<UserRole, string[]> = {
  farmer:      ["coconut", "rubber", "banana", "arecanut", "black-pepper", "cardamom", "cocoa", "ginger", "turmeric", "coffee"],
  trader:      ["rubber", "black-pepper", "cardamom", "cocoa", "arecanut", "coffee", "ginger", "turmeric", "coconut", "banana"],
  cooperative: ["coconut", "rubber", "banana", "cocoa", "arecanut", "black-pepper", "cardamom", "ginger", "turmeric", "coffee"],
  consumer:    ["banana", "coconut", "black-pepper", "ginger", "turmeric"],
};
