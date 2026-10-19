"""
Management command: seed_commodities

Creates the 13 target commodities in the database.
Safe to run multiple times — uses get_or_create.
"""
from django.core.management.base import BaseCommand
from api.models import Commodity

COMMODITIES = [
    # Plantation crops
    {"slug": "rubber",      "name": "Rubber",       "category": "plantation"},
    {"slug": "coconut",     "name": "Coconut",       "category": "plantation"},
    {"slug": "arecanut",    "name": "Arecanut",      "category": "plantation"},
    {"slug": "cocoa",       "name": "Cocoa",         "category": "plantation"},
    {"slug": "coffee",      "name": "Coffee",        "category": "plantation"},
    # Spices
    {"slug": "nutmeg",      "name": "Nutmeg",        "category": "spices"},
    {"slug": "black-pepper","name": "Black Pepper",  "category": "spices"},
    {"slug": "cardamom",    "name": "Cardamom",      "category": "spices"},
    {"slug": "ginger",      "name": "Ginger",        "category": "spices"},
    {"slug": "turmeric",    "name": "Turmeric",      "category": "spices"},
    {"slug": "cloves",      "name": "Cloves",        "category": "spices"},
    {"slug": "cinnamon",    "name": "Cinnamon",      "category": "spices"},
    # Fruits
    {"slug": "banana",      "name": "Banana",        "category": "fruits"},
]


class Command(BaseCommand):
    help = "Seed the 13 target commodities into the database"

    def handle(self, *args, **options):
        created_count = 0
        for data in COMMODITIES:
            obj, created = Commodity.objects.get_or_create(
                slug=data["slug"],
                defaults={"name": data["name"], "category": data["category"], "is_active": True},
            )
            if created:
                created_count += 1
                self.stdout.write(f"  Created: {obj.name}")
            else:
                # Update name/category in case they changed
                obj.name = data["name"]
                obj.category = data["category"]
                obj.is_active = True
                obj.save(update_fields=["name", "category", "is_active"])

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {len(COMMODITIES)} commodities ({created_count} new)."
            )
        )
