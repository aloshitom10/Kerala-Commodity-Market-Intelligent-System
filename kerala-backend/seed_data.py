"""
Seed script – populates the database with Kerala districts, markets, commodities,
and 90 days of synthetic price history for each commodity/market pair.

Run:
    python manage.py shell < seed_data.py
or:
    python manage.py runscript seed_data   (with django-extensions)
"""
import os
import random
import math
from datetime import date, timedelta
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from api.models import Commodity, District, Market, PriceRecord  # noqa: E402

random.seed(42)

# ─── Districts ────────────────────────────────────────────────────────────────
DISTRICTS_DATA = [
    ("Thiruvananthapuram", "TVM", 8.5241, 76.9366),
    ("Kollam", "KLM", 8.8932, 76.6141),
    ("Pathanamthitta", "PTA", 9.2648, 76.7870),
    ("Alappuzha", "ALP", 9.4981, 76.3388),
    ("Kottayam", "KTM", 9.5916, 76.5222),
    ("Idukki", "IDK", 9.9189, 77.1025),
    ("Ernakulam", "EKM", 9.9816, 76.2999),
    ("Thrissur", "TCR", 10.5276, 76.2144),
    ("Palakkad", "PKD", 10.7867, 76.6548),
    ("Malappuram", "MLP", 11.0510, 76.0711),
    ("Kozhikode", "KZD", 11.2588, 75.7804),
    ("Wayanad", "WYD", 11.6854, 76.1320),
    ("Kannur", "KNR", 11.8745, 75.3704),
    ("Kasaragod", "KGD", 12.4996, 74.9869),
]

MARKETS_DATA = {
    "Thiruvananthapuram": ["East Fort Market", "Chalai Market", "Pettah Market"],
    "Kollam": ["Chinnakada Market", "Polayathode Market"],
    "Pathanamthitta": ["Adoor Market", "Thiruvalla Market"],
    "Alappuzha": ["Alappuzha Municipal Market", "Cherthala Market"],
    "Kottayam": ["Nagampadam Market", "Kodimatha Market"],
    "Idukki": ["Thodupuzha Market", "Munnar Market"],
    "Ernakulam": ["Broadway Market", "Kaloor Market", "Aluva Market"],
    "Thrissur": ["Swaraj Round Market", "Punkunnam Market"],
    "Palakkad": ["Palakkad Town Market", "Chittur Market"],
    "Malappuram": ["Malappuram Market", "Tirur Market"],
    "Kozhikode": ["Kozhikode Beach Market", "Mavoor Road Market"],
    "Wayanad": ["Kalpetta Market", "Sulthan Bathery Market"],
    "Kannur": ["Kannur Market", "Thalassery Market"],
    "Kasaragod": ["Kasaragod Market", "Kanhangad Market"],
}

COMMODITIES_DATA = [
    {"slug": "coconut",   "name": "Coconut",      "unit": "piece", "category": "cash_crops", "icon": "🥥", "base_price": 22},
    {"slug": "rubber",    "name": "Rubber",        "unit": "kg",    "category": "cash_crops", "icon": "🌿", "base_price": 190},
    {"slug": "banana",    "name": "Banana",        "unit": "dozen", "category": "fruits",     "icon": "🍌", "base_price": 48},
    {"slug": "tapioca",   "name": "Tapioca",       "unit": "kg",    "category": "vegetables", "icon": "🌾", "base_price": 28},
    {"slug": "pepper",    "name": "Black Pepper",  "unit": "kg",    "category": "spices",     "icon": "⚫", "base_price": 730},
    {"slug": "cardamom",  "name": "Cardamom",      "unit": "kg",    "category": "spices",     "icon": "🌱", "base_price": 1900},
    {"slug": "cocoa",     "name": "Cocoa",         "unit": "kg",    "category": "cash_crops", "icon": "🍫", "base_price": 280},
    {"slug": "nutmeg",    "name": "Nutmeg",        "unit": "kg",    "category": "spices",     "icon": "🫚", "base_price": 850},
    {"slug": "areca_nut", "name": "Areca Nut",     "unit": "kg",    "category": "cash_crops", "icon": "🌴", "base_price": 420},
    {"slug": "vanilla",   "name": "Vanilla",       "unit": "kg",    "category": "spices",     "icon": "🌸", "base_price": 4500},
]

DISTRICT_MULTIPLIERS = {
    "Thiruvananthapuram": 1.05, "Kollam": 0.97, "Pathanamthitta": 1.02,
    "Alappuzha": 0.95, "Kottayam": 1.0, "Idukki": 0.93, "Ernakulam": 1.08,
    "Thrissur": 1.03, "Palakkad": 0.96, "Malappuram": 0.99, "Kozhikode": 1.01,
    "Wayanad": 0.91, "Kannur": 1.04, "Kasaragod": 0.98,
}


def seeded_variation(seed_val):
    x = math.sin(seed_val + 1) * 10000
    return x - math.floor(x)


print("Creating districts…")
district_objs = {}
for name, code, lat, lon in DISTRICTS_DATA:
    d, _ = District.objects.update_or_create(
        code=code,
        defaults={"name": name, "latitude": lat, "longitude": lon},
    )
    district_objs[name] = d

print("Creating markets…")
market_objs = {}
for district_name, markets in MARKETS_DATA.items():
    for mname in markets:
        m, _ = Market.objects.update_or_create(
            name=mname,
            district=district_objs[district_name],
            defaults={"is_active": True},
        )
        market_objs[(district_name, mname)] = m

print("Creating commodities…")
commodity_objs = {}
for cd in COMMODITIES_DATA:
    c, _ = Commodity.objects.update_or_create(
        slug=cd["slug"],
        defaults={
            "name": cd["name"],
            "unit": cd["unit"],
            "category": cd["category"],
            "icon": cd["icon"],
            "is_active": True,
        },
    )
    commodity_objs[cd["slug"]] = (c, cd["base_price"])

print("Seeding 90 days of price history…")
today = date.today()
records_created = 0

for district_name, markets in MARKETS_DATA.items():
    mult = DISTRICT_MULTIPLIERS.get(district_name, 1.0)
    for mname in markets:
        market = market_objs[(district_name, mname)]
        for slug, (commodity, base_price) in commodity_objs.items():
            for days_ago in range(90, -1, -1):
                d = today - timedelta(days=days_ago)
                seed = days_ago * 13 + len(slug) * 7 + len(district_name) * 3
                variation = 0.88 + seeded_variation(seed) * 0.24
                price = round(base_price * mult * variation, 2)
                min_p = round(price * 0.9, 2)
                max_p = round(price * 1.1, 2)
                avg_p = round((min_p + max_p) / 2, 2)

                PriceRecord.objects.update_or_create(
                    commodity=commodity,
                    market=market,
                    date=d,
                    defaults={
                        "price": price,
                        "min_price": min_p,
                        "max_price": max_p,
                        "average_price": avg_p,
                        "source": "seed",
                    },
                )
                records_created += 1

print(f"✅ Seed complete! Created {records_created} price records.")
