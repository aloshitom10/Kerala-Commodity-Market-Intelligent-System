"""
Management command: fetch_ecostat

Fetches daily wholesale price data from Kerala DES Ecostat and stores it
in the MarketPrice table. Idempotent — uses upsert so running it twice
for the same date does not create duplicates.

Usage:
    python manage.py fetch_ecostat                      # fetch yesterday (safe default)
    python manage.py fetch_ecostat --date 2025-01-15    # specific date
    python manage.py fetch_ecostat --from 2025-01-10 --to 2025-01-17  # date range
    python manage.py fetch_ecostat --backfill 7         # last N days

The source endpoint is:
    GET https://www.ecostat.kerala.gov.in/subset-download/416
        ?from=YYYY-MM-DD&to=YYYY-MM-DD
Returns CSV with columns:
    Date, District, Centre, Item, Price, "Price Unit",
    "Prev Day Price", "Prev Day Price Unit"
"""
import csv
import io
import logging
from datetime import date, timedelta

import requests
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from api.models import Commodity, DataIngestionLog, MarketPrice

logger = logging.getLogger(__name__)

# ─── Commodity name normalisation map ────────────────────────────────────────
# Keys are exact Ecostat item strings (or substrings we test for).
# Values are canonical slugs matching our Commodity table.
COMMODITY_MAP = {
    # Rubber — Ecostat sends "(Quintal)" suffix
    "Rubber Lot (Quintal)":   "rubber",
    "Rubber RSS 4 (Quintal)": "rubber",
    "Rubber RSS 5 (Quintal)": "rubber",
    # Coconut
    "Coconut Without Husk (W O H) (Quintal)":   "coconut",
    "Coconut Without Husk (W O H) (1000 Nos)":  "coconut",
    "Coconut With Husk (W H) (1000 Nos)":       "coconut",
    "Coconut without Husk(W O H)2 (Quintal)":   "coconut",
    # Arecanut
    "Arecanut (Ripe) (1000 Nos)":               "arecanut",
    "Arecanut (Ripe) (Quintal)":                "arecanut",
    "Arecanut Dry 1st Quality (Quintal)":        "arecanut",
    "Arecanut Dry 2nd Quality (Quintal)":        "arecanut",
    "Arecanut Dry New (Quintal)":               "arecanut",
    "Arecanut Dry Old (Quintal)":               "arecanut",
    "Tender Arecanut (Paiga) (Quintal)":        "arecanut",
    # Cocoa
    "Cocoa (Quintal)":            "cocoa",
    "Cocoa Bean (Quintal)":       "cocoa",
    "Cocoa Dry Beans (Quintal)":  "cocoa",
    "Cocoa Seed (Quintal)":       "cocoa",
    "Cocoa Wet Beans (Quintal)":  "cocoa",   # actual Ecostat name
    # Coffee
    "Coffee (Quintal)": "coffee",
    # Banana
    "Banana Nadan (Local) (Quintal)":   "banana",
    "Banana  Pandy (Varavu) (Quintal)": "banana",
    "Banana (Wayanadan) (Quintal)":     "banana",
    "Mysore Banana (Quintal)":          "banana",  # actual Ecostat name
    # Black Pepper
    "Pepper (Chettan) (Quintal)":   "black-pepper",
    "Pepper (Nadan) (Quintal)":     "black-pepper",
    "Pepper (Ungarbled) (Quintal)": "black-pepper",
    "Pepper (Wayanadan) (Quintal)": "black-pepper",
    "Pepper Garbled (Quintal)":     "black-pepper",
    # Cardamom
    "Cardamom AGL (Kg)":     "cardamom",
    "Cardamom Green (Kg)":   "cardamom",
    "Cardamom Kanni (Kg)":   "cardamom",
    "Cardamom Mysoor (Kg)":  "cardamom",
    "Cardamon (White) (Kg)": "cardamom",
    # Ginger
    "Ginger (Dry) (Quintal)":            "ginger",
    "Ginger (Dry) Unbleached (Quintal)": "ginger",
    "Ginger (Fresh New) (Quintal)":      "ginger",
    "Ginger Dry New (Quintal)":          "ginger",   # trimmed trailing space
    # Turmeric
    "Turmeric (Quintal)":       "turmeric",
    "Turmeric Nadan (Quintal)": "turmeric",
    # Nutmeg / Cloves / Cinnamon — not in Ecostat subset 416
}

# ─── Source URL ──────────────────────────────────────────────────────────────
ECOSTAT_CSV_URL = "https://www.ecostat.kerala.gov.in/subset-download/416"
REQUEST_TIMEOUT = 60  # seconds


def parse_price(value: str):
    """Convert a price string to float, returning None for blanks/dashes."""
    v = value.strip()
    if not v or v in ("-", "N/A", "NA", "nil", "Nil"):
        return None
    try:
        return float(v)
    except ValueError:
        return None


def fetch_csv(from_date: str, to_date: str) -> list[dict]:
    """
    Fetch CSV from Ecostat for the given date range.
    Returns a list of raw row dicts.
    Raises requests.RequestException on network errors.
    """
    params = {"from": from_date, "to": to_date}
    resp = requests.get(ECOSTAT_CSV_URL, params=params, timeout=REQUEST_TIMEOUT)
    resp.raise_for_status()

    content = resp.text
    reader = csv.DictReader(io.StringIO(content))
    return list(reader)


def normalise_rows(raw_rows: list[dict], commodity_cache: dict) -> tuple[list, int]:
    """
    Normalise and validate raw CSV rows.

    Returns (valid_rows, rejected_count) where valid_rows is a list of
    dicts ready for upsert into MarketPrice.
    """
    valid = []
    rejected = 0

    for row in raw_rows:
        item_name = row.get("Item", "").strip()
        slug = COMMODITY_MAP.get(item_name)
        if not slug:
            rejected += 1
            continue  # Not one of our 13 target commodities

        commodity = commodity_cache.get(slug)
        if not commodity:
            rejected += 1
            logger.warning("Commodity slug '%s' not in DB (item: %s)", slug, item_name)
            continue

        # Validate required fields
        price_date_str = row.get("Date", "").strip()
        district = row.get("District", "").strip()
        centre = row.get("Centre", "").strip()

        if not price_date_str or not district or not centre:
            rejected += 1
            continue

        price = parse_price(row.get("Price", ""))
        # Reject rows where price is null (no data reported)
        if price is None:
            rejected += 1
            continue

        valid.append({
            "price_date": price_date_str,
            "district": district,
            "market_centre": centre,
            "commodity": commodity,
            "raw_item_name": item_name,
            "price": price,
            "price_unit": row.get("Price Unit", "Rs.").strip() or "Rs.",
            "prev_day_price": parse_price(row.get("Prev Day Price", "")),
            "source": "ecostat",
        })

    return valid, rejected


def upsert_prices(valid_rows: list[dict]) -> tuple[int, int]:
    """
    Upsert valid_rows into MarketPrice. Returns (inserted, updated).
    """
    inserted = updated = 0

    with transaction.atomic():
        for row in valid_rows:
            obj, created = MarketPrice.objects.update_or_create(
                price_date=row["price_date"],
                district=row["district"],
                market_centre=row["market_centre"],
                commodity=row["commodity"],
                defaults={
                    "price": row["price"],
                    "price_unit": row["price_unit"],
                    "prev_day_price": row["prev_day_price"],
                    "raw_item_name": row["raw_item_name"],
                    "source": row["source"],
                },
            )
            if created:
                inserted += 1
            else:
                updated += 1

    return inserted, updated


def ingest_date_range(from_date: str, to_date: str, commodity_cache: dict) -> DataIngestionLog:
    """
    Fetch, normalise, and upsert prices for [from_date, to_date].
    The Ecostat API returns data only for a single day per request, so we
    iterate day-by-day across the range.
    Logs the combined result and returns the log entry.
    """
    from datetime import date as _date, timedelta  # avoid shadowing outer import
    start = _date.fromisoformat(from_date)
    end   = _date.fromisoformat(to_date)

    total_fetched = total_inserted = total_updated = total_rejected = 0
    last_status = "success"
    last_error  = ""

    current = start
    while current <= end:
        day_str = current.isoformat()
        try:
            raw_rows = fetch_csv(day_str, day_str)
            total_fetched += len(raw_rows)

            valid_rows, rejected = normalise_rows(raw_rows, commodity_cache)
            total_rejected += rejected

            inserted, updated = upsert_prices(valid_rows)
            total_inserted += inserted
            total_updated  += updated

            if rejected > 0:
                last_status = "partial"

        except Exception as exc:
            last_status = "failed"
            last_error  = str(exc)
            logger.exception("Ecostat ingestion failed for %s", day_str)

        current += timedelta(days=1)

    log = DataIngestionLog(
        fetch_date=from_date,
        status=last_status,
        rows_fetched=total_fetched,
        rows_inserted=total_inserted,
        rows_updated=total_updated,
        rows_rejected=total_rejected,
        error_message=last_error,
    )
    log.save()
    return log


class Command(BaseCommand):
    help = "Fetch daily wholesale commodity prices from Kerala DES Ecostat"

    def add_arguments(self, parser):
        parser.add_argument(
            "--date",
            type=str,
            help="Fetch a specific date (YYYY-MM-DD). Defaults to yesterday.",
        )
        parser.add_argument(
            "--from",
            dest="from_date",
            type=str,
            help="Start of date range (YYYY-MM-DD).",
        )
        parser.add_argument(
            "--to",
            dest="to_date",
            type=str,
            help="End of date range (YYYY-MM-DD).",
        )
        parser.add_argument(
            "--backfill",
            type=int,
            help="Fetch the last N calendar days.",
        )

    def handle(self, *args, **options):
        # Build commodity cache (slug → Commodity object)
        commodity_cache = {c.slug: c for c in Commodity.objects.filter(is_active=True)}
        if not commodity_cache:
            raise CommandError(
                "No active commodities found in the database. "
                "Run 'python manage.py seed_commodities' first."
            )

        # Determine date range
        today = date.today()
        yesterday = today - timedelta(days=1)

        if options["backfill"]:
            from_date = (today - timedelta(days=options["backfill"])).isoformat()
            to_date = yesterday.isoformat()
        elif options["date"]:
            from_date = to_date = options["date"]
        elif options["from_date"] or options["to_date"]:
            from_date = options["from_date"] or yesterday.isoformat()
            to_date = options["to_date"] or yesterday.isoformat()
        else:
            # Default: fetch yesterday
            from_date = to_date = yesterday.isoformat()

        self.stdout.write(f"Fetching Ecostat prices from {from_date} to {to_date} …")

        log = ingest_date_range(from_date, to_date, commodity_cache)

        self.stdout.write(
            self.style.SUCCESS(
                f"Done — status={log.status} "
                f"fetched={log.rows_fetched} "
                f"inserted={log.rows_inserted} "
                f"updated={log.rows_updated} "
                f"rejected={log.rows_rejected}"
            )
        )
        if log.status == "failed":
            self.stderr.write(f"Error: {log.error_message}")
