# KeramPulse — Kerala Commodity Market Intelligence Platform

> Real-time wholesale commodity price monitoring, trends, AI forecasts and district-wise insights across all 14 Kerala districts.  
> Data sourced live from **Kerala DES — Market Intelligence** (Ecostat).

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
- [Screenshots](#screenshots)

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
| Database | SQLite (dev) / PostgreSQL (production) |
| ML | scikit-learn (GradientBoostingRegressor), pandas, numpy |
| Data Source | Kerala DES Ecostat (public API, no key required) |

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
│   │   └── management/commands/ # fetch_ecostat management command
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
python manage.py runserver
```

Backend runs at **http://localhost:8000**

> To seed / refresh price data manually:
> ```bash
> python manage.py fetch_ecostat
> ```

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
| `DB_NAME` | `kerala_prices_db` | PostgreSQL database name |
| `DB_USER` | `kerala_user` | PostgreSQL user |
| `DB_PASSWORD` | — | PostgreSQL password |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DATABASE_URL` | — | Full DB URL (overrides above) |
| `ECOSTAT_SUBSET_ID` | `416` | Kerala DES dataset ID |

### Frontend — `kerala-price-platform/.env.local`

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api` | Backend API base URL |

---

## API Reference

Base URL: `http://localhost:8000/api/`

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

See [DEPLOYMENT.md](../DEPLOYMENT.md) or the section below for full instructions.

### Frontend → Vercel (recommended, free)

1. Go to [vercel.com](https://vercel.com) and import the GitHub repo
2. Set **Root Directory** to `kerala-price-platform`
3. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-backend-url/api`
4. Deploy — Vercel auto-deploys on every push to `main`

### Backend → Railway (recommended, free tier)

1. Go to [railway.app](https://railway.app) and create a new project
2. Connect the GitHub repo, set **Root Directory** to `kerala-backend`
3. Add a PostgreSQL plugin from the Railway dashboard
4. Set environment variables: `DEBUG=False`, `SECRET_KEY=<strong-key>`, `DATABASE_URL=<from Railway>`, `ALLOWED_HOSTS=<your-railway-domain>`
5. Set start command: `gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT`
6. Deploy

### Alternative backend hosts

| Platform | Free Tier | Notes |
|---|---|---|
| [Render](https://render.com) | ✅ Yes | Add `gunicorn` start command, PostgreSQL add-on available |
| [Fly.io](https://fly.io) | ✅ Yes | Good for containerised Django |
| [PythonAnywhere](https://pythonanywhere.com) | ✅ Yes | Easiest for Django beginners |

---

## Data Source

All price data is sourced from **Kerala Department of Economics & Statistics (DES) — Market Intelligence Dashboard**:  
🔗 https://www.ecostat.kerala.gov.in/mi-prices-dashboard

Data is fetched automatically every day at 08:00 IST. No API key is required.

---

## License

MIT — free to use, modify and distribute.
