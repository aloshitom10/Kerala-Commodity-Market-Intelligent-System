"use client";
/**
 * Minimal i18n for English ↔ Malayalam.
 * Usage:
 *   const { t, lang, setLang } = useLang();
 *   t("marketPrices")  →  "Market Prices" | "വിപണി വില"
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Lang = "en" | "ml";

// ─── Translation dictionary ────────────────────────────────────────────────

export const translations = {
  // ── Navbar ────────────────────────────────────────────────────────────────
  appName:            { en: "KeramPulse",               ml: "KeramPulse" },
  appSub:             { en: "Market Intelligence",      ml: "വിപണി ഇന്റലിജൻസ്" },
  marketPrices:       { en: "Market Prices",            ml: "വിപണി വില" },
  trends:             { en: "Trends",                   ml: "ട്രെൻഡുകൾ" },
  districtComparison: { en: "District Comparison",      ml: "ജില്ലാ താരതമ്യം" },
  marketInsights:     { en: "Market Insights",          ml: "വിപണി ഉൾക്കാഴ്ച" },
  aiForecast:         { en: "AI Forecast",              ml: "AI പ്രവചനം" },
  search:             { en: "Search",                   ml: "തിരയൽ" },
  changeRole:         { en: "Change role",              ml: "റോൾ മാറ്റുക" },
  viewingAs:          { en: "Viewing as",               ml: "കാണുന്നത്" },

  // ── Language toggle ───────────────────────────────────────────────────────
  langEn:             { en: "EN",                       ml: "EN" },
  langMl:             { en: "മലയാളം",                   ml: "മലയാളം" },

  // ── Homepage ──────────────────────────────────────────────────────────────
  heroTitle:          { en: "KeramPulse — Kerala Market Intelligence", ml: "KeramPulse — കേരള വിപണി ഇന്റലിജൻസ്" },
  heroSub:            { en: "Daily wholesale price data for coconut, rubber, spices & more — across all 14 Kerala districts. Live from Kerala DES.", ml: "കേരളത്തിലെ 14 ജില്ലകളിലും തേങ്ങ, റബ്ബർ, സുഗന്ധദ്രവ്യങ്ങൾ & കൂടുതൽ ചരക്കുകളുടെ ദൈനംദിന മൊത്ത വിലകൾ. Kerala DES-ൽ നിന്ന് നേരിട്ട്." },
  whoAreYou:          { en: "Who are you?",             ml: "നിങ്ങൾ ആരാണ്?" },
  selectRoleSub:      { en: "Select your role to get a personalised market view", ml: "വ്യക്തിഗതമായ വിപണി കാഴ്ചപ്പാടിനായി നിങ്ങളുടെ റോൾ തിരഞ്ഞെടുക്കുക" },
  changeRoleAnytime:  { en: "You can change your role anytime from the navigation bar", ml: "നാവിഗേഷൻ ബാറിൽ നിന്ന് ഏത് സമയത്തും നിങ്ങളുടെ റോൾ മാറ്റാം" },
  commodities:        { en: "Commodities",              ml: "ചരക്കുകൾ" },
  districts:          { en: "Districts",                ml: "ജില്ലകൾ" },
  markets:            { en: "Markets",                  ml: "മാർക്കറ്റുകൾ" },
  updated:            { en: "Updated",                  ml: "അപ്ഡേറ്റ്" },
  daily:              { en: "Daily",                    ml: "ദൈനംദിന" },
  loadingPlatform:    { en: "Loading platform…",        ml: "പ്ലാറ്റ്‌ഫോം ലോഡ് ചെയ്യുന്നു…" },

  // ── Role labels / descs ───────────────────────────────────────────────────
  roleFarmer:         { en: "Farmer",                   ml: "കർഷകൻ" },
  roleTrader:         { en: "Trader",                   ml: "വ്യാപാരി" },
  roleCooperative:    { en: "Cooperative",              ml: "കോ-ഓപ്പറേറ്റീവ്" },
  roleConsumer:       { en: "Consumer",                 ml: "ഉപഭോക്താവ്" },

  // ── Homepage dashboard ────────────────────────────────────────────────────
  livePrices:         { en: "Live wholesale prices from Kerala DES Market Intelligence", ml: "Kerala DES വിപണി ഇന്റലിജൻസിൽ നിന്ന് തത്സമയ മൊത്ത വിലകൾ" },
  todaysPrices:       { en: "Today's Prices",           ml: "ഇന്നത്തെ വിലകൾ" },
  todaysPriceMoves:   { en: "Today's Price Movements",  ml: "ഇന്നത്തെ വില ചലനങ്ങൾ" },
  fullDashboard:      { en: "Full dashboard",           ml: "പൂർണ്ണ ഡാഷ്‌ബോർഡ്" },
  loading:            { en: "Loading…",                 ml: "ലോഡ് ചെയ്യുന്നു…" },
  checkTodayPrices:   { en: "Check Today's Prices",     ml: "ഇന്നത്തെ വിലകൾ നോക്കുക" },
  priceDashboard:     { en: "Price Dashboard",          ml: "വില ഡാഷ്‌ബോർഡ്" },
  priceDashboardDesc: { en: "Current wholesale prices by commodity and district", ml: "ചരക്കും ജില്ലയും അനുസരിച്ച് നിലവിലെ മൊത്ത വിലകൾ" },
  historicalTrends:   { en: "Historical Trends",        ml: "ചരിത്രപരമായ ട്രെൻഡുകൾ" },
  historicalTrendsDesc:{ en: "Daily & weekly price charts", ml: "ദൈനംദിന & വാർഷിക വില ചാർട്ടുകൾ" },
  marketArbitrage:    { en: "Market Arbitrage",         ml: "വിപണി ആർബിട്രേജ്" },
  districtCompDesc:   { en: "Compare prices across Kerala districts", ml: "കേരള ജില്ലകളിലുടനീളം വിലകൾ താരതമ്യം ചെയ്യുക" },
  sellingAdvice:      { en: "Selling Advice",           ml: "വിൽപ്പന ഉപദേശം" },
  marketInsightsDesc: { en: "Trend analysis & actionable market intelligence", ml: "ട്രെൻഡ് വിശകലനവും ക്രിയാത്മക വിപണി ഇന്റലിജൻസും" },
  aiPriceForecast:    { en: "AI Price Forecast",        ml: "AI വില പ്രവചനം" },
  aiPriceForecastDesc:{ en: "ML-based price predictions for next 1, 7 & 30 days", ml: "അടുത്ത 1, 7 & 30 ദിവസങ്ങൾക്കുള്ള ML അടിസ്ഥാനമായ വില പ്രവചനങ്ങൾ" },
  dataSource:         { en: "Data source:",             ml: "ഡേറ്റ ഉറവിടം:" },
  dataSourceDesc:     { en: "Wholesale prices reported by market committees across Kerala. Updated daily.", ml: "കേരളത്തിലുടനീളമുള്ള മാർക്കറ്റ് കമ്മിറ്റികൾ റിപ്പോർട്ട് ചെയ്ത മൊത്ത വിലകൾ. ദൈനംദിന അപ്ഡേറ്റ്." },
  lastData:           { en: "Last data:",               ml: "അവസാന ഡേറ്റ:" },

  // ── Prices page ───────────────────────────────────────────────────────────
  marketPriceDashboard: { en: "Market Price Dashboard", ml: "വിപണി വില ഡാഷ്‌ബോർഡ്" },
  liveWholesale:      { en: "Live wholesale prices from Kerala DES Market Intelligence", ml: "Kerala DES-ൽ നിന്ന് തത്സമയ മൊത്ത വിലകൾ" },
  refresh:            { en: "Refresh",                  ml: "പുതുക്കുക" },
  commodity:          { en: "Commodity",                ml: "ചരക്ക്" },
  district:           { en: "District",                 ml: "ജില്ല" },
  marketCentre:       { en: "Market Centre",            ml: "മാർക്കറ്റ് കേന്ദ്രം" },
  currentPrice:       { en: "Current Price",            ml: "നിലവിലെ വില" },
  perQuintal:         { en: "per quintal / unit",       ml: "ക്വിന്റൽ / യൂണിറ്റ് പ്രകാരം" },
  minimum:            { en: "Minimum",                  ml: "കുറഞ്ഞ വില" },
  maximum:            { en: "Maximum",                  ml: "ഉയർന്ന വില" },
  average:            { en: "Average",                  ml: "ശരാശരി" },
  acrossDistrict:     { en: "across",                   ml: "ഉടനീളം" },
  lowestToday:        { en: "Lowest price today",       ml: "ഇന്ന് ഏറ്റവും കുറഞ്ഞ വില" },
  highestToday:       { en: "Highest price today",      ml: "ഇന്ന് ഏറ്റവും ഉയർന്ന വില" },
  acrossAllMarkets:   { en: "across all markets",       ml: "എല്ലാ മാർക്കറ്റുകളിലും" },
  marketsReporting:   { en: "markets reporting",        ml: "മാർക്കറ്റുകൾ റിപ്പോർട്ട് ചെയ്തു" },
  allCommodityPrices: { en: "All Commodity Prices",     ml: "എല്ലാ ചരക്കുകളുടെ വിലകൾ" },
  avgPrice:           { en: "Avg Price",                ml: "ശരാശരി വില" },
  min:                { en: "Min",                      ml: "കുറഞ്ഞത്" },
  max:                { en: "Max",                      ml: "ഉയർന്നത്" },
  marketsCount:       { en: "Markets",                  ml: "മാർക്കറ്റുകൾ" },
  loadingPrices:      { en: "Loading prices…",          ml: "വിലകൾ ലോഡ് ചെയ്യുന്നു…" },
  noData:             { en: "No data available",        ml: "ഡേറ്റ ലഭ്യമല്ല" },
  category:           { en: "Category",                 ml: "വിഭാഗം" },
  data:               { en: "Data:",                    ml: "ഡേറ്റ:" },
  lastUpdated:        { en: "Last updated:",            ml: "അവസാനം അപ്ഡേറ്റ്:" },
  backendError:       { en: "Could not load prices: {0}. Ensure the backend is running at localhost:8000.", ml: "വിലകൾ ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല: {0}. ബാക്കെൻഡ് localhost:8000-ൽ പ്രവർത്തിക്കുന്നുണ്ടെന്ന് ഉറപ്പ് വരുത്തുക." },

  // ── Trends page ───────────────────────────────────────────────────────────
  historicalPriceTrends: { en: "Historical Price Trends", ml: "ചരിത്രപരമായ വില ട്രെൻഡുകൾ" },
  dailyWholesale:     { en: "Daily wholesale price history from Kerala DES Market Intelligence", ml: "Kerala DES-ൽ നിന്ന് ദൈനംദിന മൊത്ത വില ചരിത്രം" },
  districtOptional:   { en: "District (optional)",      ml: "ജില്ല (ഐച്ഛികം)" },
  allDistricts:       { en: "All Districts",            ml: "എല്ലാ ജില്ലകളും" },
  period:             { en: "Period",                   ml: "കാലയളവ്" },
  chartType:          { en: "Chart Type",               ml: "ചാർട്ട് തരം" },
  latestPrice:        { en: "Latest Price",             ml: "ഏറ്റവും പുതിയ വില" },
  periodHigh:         { en: "Period High",              ml: "കാലയളവിലെ ഉയർന്ന വില" },
  periodLow:          { en: "Period Low",               ml: "കാലയളവിലെ കുറഞ്ഞ വില" },
  periodAvg:          { en: "Period Avg",               ml: "കാലയളവ് ശരാശരി" },
  priceTrend:         { en: "Price Trend",              ml: "വില ട്രെൻഡ്" },
  dataPoints:         { en: "data points",              ml: "ഡേറ്റ പോയിന്റുകൾ" },
  loadingChart:       { en: "Loading chart…",           ml: "ചാർട്ട് ലോഡ് ചെയ്യുന്നു…" },
  noDataPeriod:       { en: "No data for selected period", ml: "തിരഞ്ഞെടുത്ത കാലയളവിൽ ഡേറ്റ ഇല്ല" },
  priceHistoryTable:  { en: "Price History Table",      ml: "വില ചരിത്ര പട്ടിക" },
  date:               { en: "Date",                     ml: "തീയതി" },
  low:                { en: "Low",                      ml: "കുറഞ്ഞ വില" },
  high:               { en: "High",                     ml: "ഉയർന്ന വില" },

  // ── Comparison page ───────────────────────────────────────────────────────
  districtWiseComparison: { en: "District-wise Price Comparison", ml: "ജില്ലാ തിരിച്ചുള്ള വില താരതമ്യം" },
  compareWholesale:   { en: "Compare wholesale prices across all Kerala districts", ml: "കേരളത്തിലെ എല്ലാ ജില്ലകളിലും മൊത്ത വിലകൾ താരതമ്യം ചെയ്യുക" },
  selectCommodity:    { en: "Select Commodity",         ml: "ചരക്ക് തിരഞ്ഞെടുക്കുക" },
  highestPrice:       { en: "Highest Price",            ml: "ഏറ്റവും ഉയർന്ന വില" },
  lowestPrice:        { en: "Lowest Price",             ml: "ഏറ്റവും കുറഞ്ഞ വില" },
  stateAverage:       { en: "State Average",            ml: "സംസ്ഥാന ശരാശരി" },
  priceSpread:        { en: "Price Spread",             ml: "വില വ്യാപ്തി" },
  highVsLow:          { en: "High vs low district",     ml: "ഉയർന്ന vs കുറഞ്ഞ ജില്ല" },
  avgPriceByDistrict: { en: "Average Price by District",ml: "ജില്ലാ ശരാശരി വില" },
  districtPriceDetails:{ en: "District Price Details",  ml: "ജില്ലാ വില വിവരങ്ങൾ" },
  rank:               { en: "Rank",                     ml: "റാങ്ക്" },
  centres:            { en: "Centres",                  ml: "കേന്ദ്രങ്ങൾ" },

  // ── Insights page ─────────────────────────────────────────────────────────
  marketInsightsTitle:{ en: "Market Insights",          ml: "വിപണി ഉൾക്കാഴ്ചകൾ" },
  liveMarketAnalysis: { en: "Live market analysis from Kerala DES", ml: "Kerala DES-ൽ നിന്ന് തത്സമയ വിപണി വിശകലനം" },
  view:               { en: "View",                     ml: "കാഴ്ചപ്പാട്" },
  topGainers:         { en: "Top Gainers",              ml: "മുൻനിര ഉയർച്ചകൾ" },
  topDecliners:       { en: "Top Decliners",            ml: "മുൻനിര ഇടിവുകൾ" },
  noGainersToday:     { en: "No gainers today",         ml: "ഇന്ന് ഉയർച്ചകൾ ഇല്ല" },
  noDeclinerToday:    { en: "No decliners today",       ml: "ഇന്ന് ഇടിവുകൾ ഇല്ല" },
  allCommoditiesSnapshot:{ en: "All Commodities — Market Snapshot", ml: "എല്ലാ ചരക്കുകളും — വിപണി സ്നാപ്‌ഷോട്ട്" },
  range:              { en: "Range",                    ml: "വ്യാപ്തി" },
  dayChange:          { en: "Day Change",               ml: "ദൈനംദിന മാറ്റം" },
  trend:              { en: "Trend",                    ml: "ട്രെൻഡ്" },
  loadingInsights:    { en: "Loading insights…",        ml: "ഉൾക്കാഴ്ചകൾ ലോഡ് ചെയ്യുന്നു…" },

  // ── Search page ───────────────────────────────────────────────────────────
  searchFilterPrices: { en: "Search & Filter Prices",   ml: "വിലകൾ തിരയുക & ഫിൽട്ടർ ചെയ്യുക" },
  searchWholesale:    { en: "Search wholesale price records from Kerala DES Market Intelligence", ml: "Kerala DES-ൽ നിന്ന് മൊത്ത വില രേഖകൾ തിരയുക" },
  allCommodities:     { en: "All Commodities",          ml: "എല്ലാ ചരക്കുകളും" },
  allCentres:         { en: "All Centres",              ml: "എല്ലാ കേന്ദ്രങ്ങളും" },
  fromDate:           { en: "From Date",                ml: "മുതൽ തീയതി" },
  toDate:             { en: "To Date",                  ml: "വരെ തീയതി" },
  searchBtn:          { en: "Search",                   ml: "തിരയുക" },
  filterResults:      { en: "Filter results by commodity, district or market…", ml: "ചരക്ക്, ജില്ല അല്ലെങ്കിൽ മാർക്കറ്റ് അനുസരിച്ച് ഫലങ്ങൾ ഫിൽട്ടർ ചെയ്യുക…" },
  results:            { en: "results",                  ml: "ഫലങ്ങൾ" },
  clickToSort:        { en: "Click column headers to sort", ml: "അടുക്കുന്നതിന് കോളം തലക്കെട്ടുകൾ ക്ലിക്ക് ചെയ്യുക" },
  searching:          { en: "Searching…",               ml: "തിരയുന്നു…" },
  setFilters:         { en: "Set filters and click Search to load prices", ml: "ഫിൽട്ടറുകൾ സജ്ജമാക്കി വില ലോഡ് ചെയ്യാൻ തിരയൽ ക്ലിക്ക് ചെയ്യുക" },
  noResults:          { en: "No results found",         ml: "ഫലങ്ങൾ കണ്ടെത്തിയില്ല" },
  prevDay:            { en: "Prev Day",                 ml: "കഴിഞ്ഞ ദിവസം" },
  showingFirst:       { en: "Showing first 200 of",     ml: "ആദ്യ 200 കാണിക്കുന്നു" },
  useMoreFilters:     { en: "results. Use more specific filters to narrow down.", ml: "ഫലങ്ങൾ. കൂടുതൽ കൃത്യമായ ഫിൽട്ടറുകൾ ഉപയോഗിക്കുക." },

  // ── Forecast page ─────────────────────────────────────────────────────────
  aiPriceForecastTitle:{ en: "AI Price Forecast",       ml: "AI വില പ്രവചനം" },
  forecastSubtitle:   { en: "Gradient-boosted ML model trained on Kerala DES historical wholesale prices", ml: "Kerala DES ചരിത്ര മൊത്ത വിലകൾ ഉപയോഗിച്ച് പരിശീലിപ്പിച്ച ML മോഡൽ" },
  tomorrow:           { en: "Tomorrow",                 ml: "നാളെ" },
  next7Days:          { en: "Next 7 Days",              ml: "അടുത്ത 7 ദിവസം" },
  next30Days:         { en: "Next 30 Days",             ml: "അടുത്ത 30 ദിവസം" },
  todayPrice:         { en: "Today's Price",            ml: "ഇന്നത്തെ വില" },
  asOf:               { en: "as of",                    ml: "മുതൽ" },
  in7Days:            { en: "In 7 Days",                ml: "7 ദിവസത്തിൽ" },
  in30Days:           { en: "In 30 Days",               ml: "30 ദിവസത്തിൽ" },
  runningModel:       { en: "Running forecast model…",  ml: "പ്രവചന മോഡൽ പ്രവർത്തിക്കുന്നു…" },
  gradientBoost:      { en: "⚡ Gradient Boost",        ml: "⚡ ഗ്രേഡിയന്റ് ബൂസ്റ്റ്" },
  ewmTrend:           { en: "📊 EWM Trend",             ml: "📊 EWM ട്രെൻഡ്" },
  fullML:             { en: "Full ML",                  ml: "പൂർണ്ണ ML" },
  limitedData:        { en: "Limited data",             ml: "പരിമിതമായ ഡേറ്റ" },
  forecastRange:      { en: "Range:",                   ml: "വ്യാപ്തി:" },
  today:              { en: "Today",                    ml: "ഇന്ന്" },
  forecastLabel:      { en: "Forecast",                 ml: "പ്രവചനം" },
  upperBound:         { en: "Upper bound",              ml: "ഉയർന്ന പരിധി" },
  lowerBound:         { en: "Lower bound",              ml: "കുറഞ്ഞ പരിധി" },
  pointEstimate:      { en: "Point Estimate",           ml: "പോയിന്റ് എസ്റ്റിമേറ്റ്" },
  vsToday:            { en: "vs today",                 ml: "ഇന്നിനെ അപേക്ഷിച്ച്" },
  dailyForecast:      { en: "Daily Forecast Breakdown", ml: "ദൈനംദിന പ്രവചന വിശദാംശങ്ങൾ" },
  confidenceBand:     { en: "Confidence band widens with forecast horizon", ml: "പ്രവചന ചക്രവാളം വർദ്ധിക്കുന്നതോടെ ആത്മവിശ്വാസ ബാൻഡ് വിശാലമാകും" },
  forecastDate:       { en: "Date",                     ml: "തീയതി" },
  forecastCol:        { en: "Forecast",                 ml: "പ്രവചനം" },
  lowerCol:           { en: "Lower",                    ml: "കുറഞ്ഞ" },
  upperCol:           { en: "Upper",                    ml: "ഉയർന്ന" },
  vsToday2:           { en: "vs Today",                 ml: "ഇന്നുമായി" },
  forecastDisclaimer: { en: "Forecast disclaimer:", ml: "പ്രവചന നിരാകരണം:" },
  forecastDisclaimerBody: { en: "Predictions are generated by a machine-learning model trained on Kerala DES wholesale price history ({0} data points). They represent statistical estimates only and are not guaranteed future prices. Commodity markets can be affected by factors not captured in historical data. Always cross-reference with current market conditions before making trading or procurement decisions.", ml: "Kerala DES മൊത്ത വില ചരിത്രം ({0} ഡേറ്റ പോയിന്റുകൾ) ഉപയോഗിച്ച് പരിശീലിപ്പിച്ച ML മോഡൽ സൃഷ്ടിക്കുന്ന പ്രവചനങ്ങളാണ് ഇവ. ഇവ സ്ഥിതിവിവരക്കണക്ക് കണക്കുകൂട്ടലുകൾ മാത്രമാണ്, ഭാവി വിലകൾക്ക് ഉറപ്പ് നൽകുന്നില്ല. ചരക്ക് വിപണികൾ ചരിത്ര ഡേറ്റയിൽ ഉൾപ്പെടാത്ത ഘടകങ്ങളാൽ ബാധിക്കപ്പെടാം. വ്യാപാര അല്ലെങ്കിൽ സംഭരണ തീരുമാനങ്ങൾ എടുക്കുന്നതിന് മുൻപ് നിലവിലെ വിപണി സ്ഥിതിഗതികളുമായി എല്ലായ്‌പ്പോഴും ക്രോസ്-ചെക്ക് ചെയ്യുക." },
  notGuaranteed:      { en: "not guaranteed future prices", ml: "ഭാവി വിലകൾക്ക് ഉറപ്പ് നൽകുന്നില്ല" },

  // ── Commodity names ───────────────────────────────────────────────────────
  rubber:             { en: "Rubber",                   ml: "റബ്ബർ" },
  coconut:            { en: "Coconut",                  ml: "തേങ്ങ" },
  arecanut:           { en: "Arecanut",                 ml: "അടക്ക" },
  cocoa:              { en: "Cocoa",                    ml: "കൊക്കോ" },
  coffee:             { en: "Coffee",                   ml: "കാപ്പി" },
  nutmeg:             { en: "Nutmeg",                   ml: "ജാതിക്ക" },
  blackPepper:        { en: "Black Pepper",             ml: "കുരുമുളക്" },
  cardamom:           { en: "Cardamom",                 ml: "ഏലക്ക" },
  ginger:             { en: "Ginger",                   ml: "ഇഞ്ചി" },
  turmeric:           { en: "Turmeric",                 ml: "മഞ്ഞൾ" },
  cloves:             { en: "Cloves",                   ml: "ഗ്രാമ്പൂ" },
  cinnamon:           { en: "Cinnamon",                 ml: "കറുവ" },
  banana:             { en: "Banana",                   ml: "വാഴപ്പഴം" },

  // ── District names ────────────────────────────────────────────────────────
  Thiruvananthapuram: { en: "Thiruvananthapuram",       ml: "തിരുവനന്തപുരം" },
  Kollam:             { en: "Kollam",                   ml: "കൊല്ലം" },
  Pathanamthitta:     { en: "Pathanamthitta",           ml: "പത്തനംതിട്ട" },
  Alappuzha:          { en: "Alappuzha",                ml: "ആലപ്പുഴ" },
  Kottayam:           { en: "Kottayam",                 ml: "കോട്ടയം" },
  Idukki:             { en: "Idukki",                   ml: "ഇടുക്കി" },
  Ernakulam:          { en: "Ernakulam",                ml: "എറണാകുളം" },
  Thrissur:           { en: "Thrissur",                 ml: "തൃശ്ശൂർ" },
  Palakkad:           { en: "Palakkad",                 ml: "പാലക്കാട്" },
  Malappuram:         { en: "Malappuram",               ml: "മലപ്പുറം" },
  Kozhikode:          { en: "Kozhikode",                ml: "കോഴിക്കോട്" },
  Wayanad:            { en: "Wayanad",                  ml: "വയനാട്" },
  Kannur:             { en: "Kannur",                   ml: "കണ്ണൂർ" },
  Kasaragod:          { en: "Kasaragod",                ml: "കാസർഗോഡ്" },

  // ── Role features (homepage dashboard) ────────────────────────────────────
  farmerF1:  { en: "📊 Today's wholesale prices for your crops",     ml: "📊 നിങ്ങളുടെ വിളകളുടെ ഇന്നത്തെ മൊത്ത വിലകൾ" },
  farmerF2:  { en: "🏪 Which market is offering the best rate",      ml: "🏪 ഏത് മാർക്കറ്റ് ഏറ്റവും നല്ല നിരക്ക് നൽകുന്നു" },
  farmerF3:  { en: "📈 Price trend — is it a good time to sell?",    ml: "📈 വില ട്രെൻഡ് — വിൽക്കാൻ നല്ല സമയമാണോ?" },
  farmerF4:  { en: "🗺️ District-wise price comparison",              ml: "🗺️ ജില്ലാ തിരിച്ചുള്ള വില താരതമ്യം" },
  traderF1:  { en: "💰 Price spreads between markets",               ml: "💰 മാർക്കറ്റുകൾ തമ്മിലുള്ള വില വ്യത്യാസം" },
  traderF2:  { en: "📊 Arbitrage opportunities across districts",    ml: "📊 ജില്ലകളിലുടനീളം ആർബിട്രേജ് അവസരങ്ങൾ" },
  traderF3:  { en: "📈 Daily and weekly price movements",            ml: "📈 ദൈനംദിന, വാർഷിക വില ചലനങ്ങൾ" },
  traderF4:  { en: "🔍 Commodity-wise price analysis",              ml: "🔍 ചരക്ക് തിരിച്ചുള്ള വില വിശകലനം" },
  coopF1:    { en: "📊 Commodity performance overview",              ml: "📊 ചരക്ക് പ്രകടന അവലോകനം" },
  coopF2:    { en: "🏪 Market-wise procurement intelligence",        ml: "🏪 മാർക്കറ്റ് തിരിച്ചുള്ള സംഭരണ ​​ഇന്റലിജൻസ്" },
  coopF3:    { en: "📈 Historical price trends for planning",        ml: "📈 ആസൂത്രണത്തിനായി ചരിത്ര വില ട്രെൻഡുകൾ" },
  coopF4:    { en: "🤝 Best buying markets for members",             ml: "🤝 അംഗങ്ങൾക്കായി മികച്ച വാങ്ങൽ മാർക്കറ്റുകൾ" },
  consF1:    { en: "🛒 Current prices at local markets",             ml: "🛒 പ്രാദേശിക മാർക്കറ്റുകളിലെ നിലവിലെ വിലകൾ" },
  consF2:    { en: "📊 Price comparison across districts",           ml: "📊 ജില്ലകളിലുടനീളം വില താരതമ്യം" },
  consF3:    { en: "📈 Is the price going up or down?",              ml: "📈 വില ഉയരുകയാണോ അതോ ഇറങ്ങുകയാണോ?" },
  consF4:    { en: "🏪 Where to find the best rates",                ml: "🏪 ഏറ്റവും നല്ل നിരക്കുകൾ എവിടെ കണ്ടെത്താം" },
} satisfies Record<string, { en: string; ml: string }>;

export type TKey = keyof typeof translations;

// ─── Context ───────────────────────────────────────────────────────────────

type LangCtx = { lang: Lang; setLang: (l: Lang) => void; t: (key: TKey) => string };

const LangContext = createContext<LangCtx>({
  lang: "en",
  setLang: () => {},
  t: (key) => translations[key]?.en ?? key,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("lang") as Lang | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "en" || stored === "ml") setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  };

  const t = (key: TKey): string => translations[key]?.[lang] ?? translations[key]?.en ?? key;

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

/** Translate commodity slug → localised name */
export function tCommodity(slug: string, lang: Lang): string {
  const map: Record<string, TKey> = {
    rubber: "rubber", coconut: "coconut", arecanut: "arecanut", cocoa: "cocoa",
    coffee: "coffee", nutmeg: "nutmeg", "black-pepper": "blackPepper",
    cardamom: "cardamom", ginger: "ginger", turmeric: "turmeric",
    cloves: "cloves", cinnamon: "cinnamon", banana: "banana",
  };
  const key = map[slug];
  return key ? translations[key][lang] : slug;
}

/** Translate district name */
export function tDistrict(name: string, lang: Lang): string {
  const key = name as TKey;
  return translations[key]?.[lang] ?? name;
}
