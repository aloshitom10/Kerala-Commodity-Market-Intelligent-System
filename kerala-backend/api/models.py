from django.db import models


class Commodity(models.Model):
    """A tradeable commodity tracked on the platform."""
    CATEGORY_CHOICES = [
        ("plantation", "Plantation"),
        ("spices", "Spices"),
        ("fruits", "Fruits"),
    ]

    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Commodities"
        ordering = ["name"]

    def __str__(self):
        return self.name


class MarketPrice(models.Model):
    """
    Daily wholesale price record from Kerala DES Market Intelligence.
    Each row represents one commodity at one market centre on one date.
    """
    price_date = models.DateField(db_index=True)
    district = models.CharField(max_length=100, db_index=True)
    market_centre = models.CharField(max_length=150, db_index=True)
    commodity = models.ForeignKey(
        Commodity,
        on_delete=models.CASCADE,
        related_name="prices",
    )
    price = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    price_unit = models.CharField(max_length=50, blank=True, default="Rs.")
    prev_day_price = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    prev_month_price = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    prev_year_price = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    # Ecostat raw item name (before normalisation) — kept for auditing
    raw_item_name = models.CharField(max_length=200, blank=True)
    source = models.CharField(max_length=100, default="ecostat")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("price_date", "district", "market_centre", "commodity")
        ordering = ["-price_date", "district", "market_centre"]
        indexes = [
            models.Index(fields=["commodity", "price_date"]),
            models.Index(fields=["district", "price_date"]),
        ]

    def __str__(self):
        return (
            f"{self.commodity.name} @ {self.market_centre} ({self.district})"
            f" on {self.price_date}: ₹{self.price}"
        )


class DataIngestionLog(models.Model):
    """Records every ETL run so failures are visible in the admin."""
    STATUS_CHOICES = [
        ("success", "Success"),
        ("partial", "Partial — some rows rejected"),
        ("failed", "Failed"),
    ]

    run_at = models.DateTimeField(auto_now_add=True)
    fetch_date = models.DateField(
        help_text="The price date that was fetched in this run"
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    rows_fetched = models.IntegerField(default=0)
    rows_inserted = models.IntegerField(default=0)
    rows_updated = models.IntegerField(default=0)
    rows_rejected = models.IntegerField(default=0)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ["-run_at"]

    def __str__(self):
        return f"Ingest {self.fetch_date} — {self.status} ({self.rows_inserted}i/{self.rows_updated}u/{self.rows_rejected}r)"
