from django.contrib import admin
from .models import Commodity, MarketPrice, DataIngestionLog


@admin.register(Commodity)
class CommodityAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "category", "is_active"]
    list_filter = ["category", "is_active"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(MarketPrice)
class MarketPriceAdmin(admin.ModelAdmin):
    list_display = ["price_date", "commodity", "district", "market_centre", "price", "price_unit"]
    list_filter = ["price_date", "district", "commodity"]
    search_fields = ["commodity__name", "district", "market_centre"]
    ordering = ["-price_date"]
    raw_id_fields = ["commodity"]


@admin.register(DataIngestionLog)
class DataIngestionLogAdmin(admin.ModelAdmin):
    list_display = [
        "run_at", "fetch_date", "status",
        "rows_fetched", "rows_inserted", "rows_updated", "rows_rejected",
    ]
    list_filter = ["status"]
    readonly_fields = [
        "run_at", "fetch_date", "status",
        "rows_fetched", "rows_inserted", "rows_updated", "rows_rejected", "error_message",
    ]
