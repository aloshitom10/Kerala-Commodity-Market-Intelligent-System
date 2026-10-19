# KeramPulse — Kerala Commodity Market Intelligence Platform

> Real-time wholesale commodity price monitoring, trends, AI forecasts and district-wise insights across all 14 Kerala districts.  
> Data sourced live from **Kerala DES — Market Intelligence** (Ecostat).

🌐 **Live App:** [kerampulse.vercel.app](https://kerampulse.vercel.app)  
🔗 **API:** [kerala-commodity-market-intelligent-system-production.up.railway.app/api](https://kerala-commodity-market-intelligent-system-production.up.railway.app/api)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Data Source](#data-source)

---

## Overview

KeramPulse tracks daily wholesale prices for 13 commodities (rubber, coconut, arecanut, black pepper, cardamom, cocoa, coffee, ginger, turmeric, cloves, cinnamon, nutmeg, banana) across all 14 Kerala districts and 30+ market centres. It provides role-based dashboards for **farmers**, **traders**, **cooperatives**, and **consumers**, with English ↔ Malayalam language support.

---

## Features

- 📊 **Live Price Dashboard** — daily wholesale prices by commodity & district
- 📈 **Historical Trends** — interactive charts with 7-day, 30-day, 90-day, 1-year views
- 🗺️ **District Comparison** — side-by-side price comparison across all 14 districts
- 💡 **Market Insights** — top gainers/losers, day-change percentages
- 🤖 **AI Price Forecast** — gradient-boosted ML model predicting 1-day, 7-day, 30-day prices with confidence bands
- 🔎 **Search & Filter** — full-text search across all price records
- 🌐 **Bilingual** — full English & Malayalam UI
- 👤 **Role-based views** — personalised dashboards for Farmer / Trader / Cooperative / Consumer
- ⏰ **Auto-ingestion** — scheduled daily fetch from Kerala DES at 08:00 IST

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4, Recharts |
| Backend | Django 4.2+, Django REST Framework, APScheduler |
| Database | PostgreSQL (Railway) / SQLite (local dev) |
| ML | scikit-learn (GradientBoostingRegressor), pandas, numpy |
| Data Source | Kerala DES Ecostat (public API, no key required) |
| Frontend Hosting | Vercel |
| Backend Hosting | Railway |

---

## Project Structure

```
Kerala-Commodity-Market-Intelligent-System/
├── kerala-backend/              # Django REST API
│   ├── api/
│   │   ├── models.py            # Commodity, MarketPrice, DataIngestionLog
│   │   ├── views.py             # All API endpoints
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   ├── forecasting.py       # ML forecasting engine
│   │   ├── scheduler.py         # APScheduler daily fetch
│   │   └── management/commands/
│   │       ├── fetch_ecostat.py # Fetch prices from Kerala DES
│   │       └── seed_commodities.py
│   ├── backend/
│   │   └── settings.py
│   ├── requirements.txt
│   └── manage.py
│
└── kerala-price-platform/       # Next.js frontend
    ├── app/
    │   ├── page.tsx             # Homepage / role selector
    │   ├── prices/              # Price dashboard
    │   ├── trends/              # Historical charts
    │   ├── comparison/          # District comparison
    │   ├── insights/            # Market insights
    │   ├── forecast/            # AI forecast
    │   └── search/              # Search & filter
    ├── components/
    │   ├── Navbar.tsx
    │   └── KPLogo.tsx
    └── lib/
        ├── data.ts              # API client & types
        ├── cache.ts             # Stale-while-revalidate cache
        ├── i18n.tsx             # English ↔ Malayalam translations
        └── utils.ts
```

---

## Local Development

### Prerequisites

- Python 3.10+
- Node.js 18+

### 1. Clone the repo

```bash
git clone https://github.com/aloshitom10/Kerala-Commodity-Market-Intelligent-System.git
cd Kerala-Commodity-Market-Intelligent-System
```

### 2. Backend setup

```bash
cd kerala-backend
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py seed_commodities
python manage.py fetch_ecostat --backfill 30
python manage.py runserver
```

Backend runs at **http://localhost:8000**

### 3. Frontend setup

```bash
cd kerala-price-platform
npm install
npm run dev
```

Frontend runs at **http://localhost:3000**

### Run both together

Open two terminals:

| Terminal 1 | Terminal 2 |
|---|---|
| `cd kerala-backend && python manage.py runserver` | `cd kerala-price-platform && npm run dev` |

---

## Environment Variables

### Backend — `kerala-backend/.env` (copy from `.env.example`)

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | (insecure dev key) | Django secret key |
| `DEBUG` | `True` | Set `False` in production |
| `ALLOWED_HOSTS` | `*` | Comma-separated allowed hosts |
| `DB_ENGINE` | `sqlite` | `sqlite` or `postgresql` |
| `DATABASE_URL` | — | Full PostgreSQL URL (overrides DB_ENGINE) |
| `ECOSTAT_SUBSET_ID` | `416` | Kerala DES dataset ID |

### Frontend — `kerala-price-platform/.env.local`

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api` | Backend API base URL |

---

## API Reference

Base URL: `https://kerala-commodity-market-intelligent-system-production.up.railway.app/api/`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/commodities/` | List all active commodities |
| GET | `/prices/` | Price records (filterable by commodity, district, date) |
| GET | `/prices/latest/` | Latest price for each commodity×market combination |
| GET | `/prices/summary/` | Min/max/avg per commodity for a given date |
| GET | `/prices/trends/` | Daily avg price over a date range |
| GET | `/comparison/districts/` | Avg price per district for a commodity |
| GET | `/insights/` | Top gainers/losers (today vs yesterday) |
| GET | `/districts/` | List of all districts with data |
| GET | `/centres/` | List of all market centres |
| GET | `/forecast/<slug>/` | AI price forecast for one commodity |
| GET | `/forecast/` | AI forecasts for all commodities |
| GET | `/source/` | Data source attribution & last ingestion status |
| GET | `/ingestion-logs/` | Last 20 ETL run logs |

---

## Deployment

The system is deployed as a monorepo with separate services:

### Frontend → Vercel

- **Platform:** [vercel.com](https://vercel.com)
- **Root Directory:** `kerala-price-platform`
- **Auto-deploys** on every push to `main`
- **Environment Variable:** `NEXT_PUBLIC_API_URL=https://kerala-commodity-market-intelligent-system-production.up.railway.app/api`

### Backend → Railway

- **Platform:** [railway.app](https://railway.app)
- **Root Directory:** `kerala-backend`
- **Start Command:** `gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT`
- **Pre-deploy Command:** `python manage.py migrate`
- **Database:** PostgreSQL (Railway plugin)
- **Environment Variables:** `DEBUG=False`, `SECRET_KEY`, `ALLOWED_HOSTS=*`, `DATABASE_URL` (auto-injected by Railway)

### Re-deploying from scratch

If you need to reseed the Railway database:

1. Go to Railway → **Settings** → **Deploy**
2. Set Pre-deploy command to:
   ```
   python manage.py migrate && python manage.py seed_commodities && python manage.py fetch_ecostat --backfill 90
   ```
3. Redeploy → then reset pre-deploy back to `python manage.py migrate`

---

## Data Source

All price data is sourced from **Kerala Department of Economics & Statistics (DES) — Market Intelligence Dashboard**:  
🔗 https://www.ecostat.kerala.gov.in/mi-prices-dashboard

Data is fetched automatically every day at 08:00 IST via APScheduler. No API key is required.

---

## License

MIT — free to use, modify and distribute.
