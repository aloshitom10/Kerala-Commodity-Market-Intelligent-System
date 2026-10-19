from django.urls import path
from . import views

urlpatterns = [
    # Commodity catalogue
    path("commodities/", views.CommodityListView.as_view(), name="commodity-list"),

    # Prices
    path("prices/", views.PriceListView.as_view(), name="price-list"),
    path("prices/latest/", views.latest_prices, name="latest-prices"),
    path("prices/summary/", views.price_summary, name="price-summary"),
    path("prices/trends/", views.price_trends, name="price-trends"),

    # Comparisons & insights
    path("comparison/districts/", views.district_comparison, name="district-comparison"),
    path("insights/", views.market_insights, name="market-insights"),

    # Metadata
    path("districts/", views.district_list, name="district-list"),
    path("centres/", views.market_centres_list, name="centres-list"),
    path("source/", views.data_source_info, name="data-source-info"),

    # Ingestion logs
    path("ingestion-logs/", views.IngestionLogListView.as_view(), name="ingestion-logs"),

    # AI Forecasting
    path("forecast/", views.all_forecasts, name="all-forecasts"),
    path("forecast/<slug:commodity_slug>/", views.commodity_forecast, name="commodity-forecast"),
]
