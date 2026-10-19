"""
APScheduler configuration for daily Ecostat price ingestion.
Runs at 08:00 IST every day (02:30 UTC).
"""
import logging
from datetime import date, timedelta

from django_apscheduler.jobstores import DjangoJobStore
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)

_scheduler = None


def daily_fetch_job():
    """Scheduled task: fetch yesterday's prices from Ecostat."""
    from api.models import Commodity
    from api.management.commands.fetch_ecostat import ingest_date_range

    yesterday = (date.today() - timedelta(days=1)).isoformat()
    commodity_cache = {c.slug: c for c in Commodity.objects.filter(is_active=True)}

    if not commodity_cache:
        logger.warning("No active commodities — skipping scheduled fetch")
        return

    log = ingest_date_range(yesterday, yesterday, commodity_cache)
    logger.info(
        "Scheduled fetch complete: status=%s inserted=%d updated=%d rejected=%d",
        log.status, log.rows_inserted, log.rows_updated, log.rows_rejected,
    )


def start_scheduler():
    global _scheduler
    if _scheduler and _scheduler.running:
        return

    _scheduler = BackgroundScheduler(timezone="Asia/Kolkata")
    _scheduler.add_jobstore(DjangoJobStore(), "default")

    _scheduler.add_job(
        daily_fetch_job,
        trigger=CronTrigger(hour=8, minute=0),  # 08:00 IST daily
        id="daily_ecostat_fetch",
        name="Daily Ecostat Price Fetch",
        replace_existing=True,
        jobstore="default",
    )

    _scheduler.start()
    logger.info("APScheduler started — daily Ecostat fetch at 08:00 IST")
