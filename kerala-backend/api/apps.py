from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "api"

    def ready(self):
        """Start the APScheduler daily ingestion job when Django starts."""
        import os
        # Only start the scheduler in the main process (not in migrations/management commands)
        if os.environ.get("RUN_MAIN") != "true" and os.environ.get("DJANGO_SCHEDULER") != "1":
            return
        try:
            from .scheduler import start_scheduler
            start_scheduler()
        except Exception:
            pass  # Don't crash startup if scheduler fails
