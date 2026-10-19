"""
Django management command: import_prices
========================================
Imports daily wholesale price data from a CSV file into the database.

Usage:
    python manage.py import_prices --file prices.csv
    python manage.py import_prices --file prices.csv --date 2024-10-07
    python manage.py import_prices --file prices.csv --overwrite
    python manage.py import_prices --file prices.csv --dry-run

Expected CSV columns (flexible header matching):
    commodity, district, market, price, min_price, max_price, date
    OR: Commodity, District, Market/Mandi, Modal Price, Min Price, Max Price, Date

The command is idempotent: re-running for the same date/commodity/market
updates the existing record (upsert) rather than creating a duplicate.
"""
import csv
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from api.models import Commodity, District, Market, PriceRecord


COLUMN_ALIASES = {
    "commodity": ["commodity", "commodity_name", "crop", "item", "variety"],
    "district":  ["district", "district_name", "location", "state/district"],
    "market":    ["market", "market_name", "market/mandi", "mandi", "market name"],
    "price":     ["price", "modal_price", "modal price", "wholesale_price", "rate", "modal"],
    "min_price": ["min_price", "min price", "minimum_price", "min", "minimum price"],
    "max_price": ["max_price", "max price", "maximum_price", "max", "maximum price"],
    "date":      ["date", "arrival_date", "price_date", "report_date", "reported date"],
}

COMMODITY_NAME_MAP = {
    "coconut":        "coconut",
    "coconuts":       "coconut",
    "rubber":         "rubber",
    "natural rubber": "rubber",
    "banana":         "banana",
    "bananas":        "banana",
    "plantain":       "banana",
    "tapioca":        "tapioca",
    "cassava":        "tapioca",
    "black pepper":   "pepper",
    "pepper":         "pepper",
    "cardamom":       "cardamom",
    "small cardamom": "cardamom",
    "cocoa":          "cocoa",
    "cacao":          "cocoa",
    "nutmeg":         "nutmeg",
    "mace/nutmeg":    "nutmeg",
    "areca nut":      "areca_nut",
    "arecanut":       "areca_nut",
    "betel nut":      "areca_nut",
    "vanilla":        "vanilla",
}


def resolve_column(headers, field):
    lower_headers = [h.strip().lower() for h in headers]
    for alias in COLUMN_ALIASES.get(field, [field]):
        if alias.lower() in lower_headers:
            return lower_headers.index(alias.lower())
    return None


def parse_date_value(value):
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%m/%d/%Y", "%d %b %Y"):
        try:
            return datetime.strptime(value.strip(), fmt).date()
        except ValueError:
            continue
    return None


def parse_decimal_value(value):
    try:
        return Decimal(value.replace(",", "").strip())
    except (InvalidOperation, ValueError, AttributeError):
        return None


class Command(BaseCommand):
    help = "Import daily wholesale price data from a CSV file"

    def add_arguments(self, parser):
        parser.add_argument("--file",      required=True, help="Path to the CSV file")
        parser.add_argument("--date",      default=None,  help="Override date for all records (YYYY-MM-DD)")
        parser.add_argument("--overwrite", action="store_true", help="Overwrite existing records")
        parser.add_argument("--dry-run",   action="store_true", help="Validate without saving")
        parser.add_argument("--source",    default="csv_import", help="Source label")

    def handle(self, *args, **options):
        filepath      = options["file"]
        overwrite     = options["overwrite"]
        dry_run       = options["dry_run"]
        source        = options["source"]
        override_date = None

        if options["date"]:
            override_date = parse_date_value(options["date"])
            if not override_date:
                raise CommandError(f"Invalid date: {options['date']}. Use YYYY-MM-DD.")

        created = updated = skipped = errors = 0

        try:
            f = open(filepath, encoding="utf-8-sig")
        except FileNotFoundError:
            raise CommandError(f"File not found: {filepath}")

        with f:
            reader  = csv.reader(f)
            headers = next(reader)
            cols    = {field: resolve_column(headers, field) for field in COLUMN_ALIASES}

            missing = [fld for fld, idx in cols.items()
                       if idx is None and fld not in ("min_price", "max_price", "date")]
            if missing:
                raise CommandError(
                    f"Required columns not found: {missing}\nHeaders in file: {headers}"
                )

            self.stdout.write(f"📂 File: {filepath}")
            self.stdout.write(f"🔗 Column map: { {k: headers[v] for k, v in cols.items() if v is not None} }")
            if dry_run:
                self.stdout.write(self.style.WARNING("🧪 DRY RUN — nothing will be saved"))

            with transaction.atomic():
                for row_num, row in enumerate(reader, start=2):
                    if not any(row):
                        continue

                    def get(field):
                        idx = cols.get(field)
                        return row[idx].strip() if idx is not None and idx < len(row) else ""

                    # ── Date ──────────────────────────────────────────────────
                    if override_date:
                        record_date = override_date
                    else:
                        date_str    = get("date")
                        record_date = parse_date_value(date_str) if date_str else date.today()
                        if not record_date:
                            self.stderr.write(f"Row {row_num}: Bad date '{date_str}' — skipped")
                            errors += 1
                            continue

                    # ── Commodity ─────────────────────────────────────────────
                    raw_name = get("commodity").lower()
                    slug     = COMMODITY_NAME_MAP.get(raw_name)
                    if not slug:
                        for key, val in COMMODITY_NAME_MAP.items():
                            if key in raw_name or raw_name in key:
                                slug = val
                                break
                    if not slug:
                        self.stderr.write(f"Row {row_num}: Unknown commodity '{get('commodity')}' — skipped")
                        errors += 1
                        continue

                    try:
                        commodity_obj = Commodity.objects.get(slug=slug)
                    except Commodity.DoesNotExist:
                        self.stderr.write(f"Row {row_num}: Slug '{slug}' not in DB — run seed_data.py first")
                        errors += 1
                        continue

                    # ── District & Market ─────────────────────────────────────
                    district_name = get("district") or "Unknown"
                    district_obj, _ = District.objects.get_or_create(
                        name__iexact=district_name,
                        defaults={"name": district_name, "code": district_name[:10].upper()},
                    )
                    market_name = get("market") or f"{district_name} Main Market"
                    market_obj, _ = Market.objects.get_or_create(
                        name=market_name, district=district_obj,
                        defaults={"is_active": True},
                    )

                    # ── Price ─────────────────────────────────────────────────
                    price = parse_decimal_value(get("price"))
                    if price is None:
                        self.stderr.write(f"Row {row_num}: Invalid price '{get('price')}' — skipped")
                        errors += 1
                        continue

                    min_p = parse_decimal_value(get("min_price"))
                    max_p = parse_decimal_value(get("max_price"))
                    avg_p = round((min_p + max_p) / 2, 2) if min_p and max_p else price

                    if dry_run:
                        self.stdout.write(f"  ✓ [{record_date}] {commodity_obj.name} @ {market_obj} → ₹{price}")
                        created += 1
                        continue

                    _, was_created = PriceRecord.objects.update_or_create(
                        commodity=commodity_obj, market=market_obj, date=record_date,
                        defaults={"price": price, "min_price": min_p, "max_price": max_p,
                                  "average_price": avg_p, "source": source},
                    )
                    if was_created:
                        created += 1
                    elif overwrite:
                        updated += 1
                    else:
                        skipped += 1

        self.stdout.write(self.style.SUCCESS(
            f"\n✅ Done — Created: {created} | Updated: {updated} | Skipped: {skipped} | Errors: {errors}"
        ))
