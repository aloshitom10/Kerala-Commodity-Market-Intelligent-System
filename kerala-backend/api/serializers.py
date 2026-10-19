from rest_framework import serializers
from .models import Commodity, MarketPrice, DataIngestionLog


class CommoditySerializer(serializers.ModelSerializer):
    class Meta:
        model = Commodity
        fields = ["id", "slug", "name", "category", "is_active"]


class MarketPriceSerializer(serializers.ModelSerializer):
    commodity_name = serializers.CharField(source="commodity.name", read_only=True)
    commodity_slug = serializers.CharField(source="commodity.slug", read_only=True)
    commodity_category = serializers.CharField(source="commodity.category", read_only=True)

    class Meta:
        model = MarketPrice
        fields = [
            "id",
            "price_date",
            "district",
            "market_centre",
            "commodity",
            "commodity_name",
            "commodity_slug",
            "commodity_category",
            "price",
            "price_unit",
            "prev_day_price",
            "prev_month_price",
            "prev_year_price",
            "source",
        ]


class DataIngestionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataIngestionLog
        fields = [
            "id",
            "run_at",
            "fetch_date",
            "status",
            "rows_fetched",
            "rows_inserted",
            "rows_updated",
            "rows_rejected",
            "error_message",
        ]
