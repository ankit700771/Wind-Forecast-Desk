# Wind Forecast Desk

Decision-support web app for a GB utility buying power on the day-ahead market. It shows (1) the latest national
wind forecast available when the purchase decision is made and (2) how accurate those forecasts have been, so the
error can be priced into the decision. Data: Elexon BMRS only (FUELHH actuals, WINDFOR forecasts), purchase
decisions made in **January 2026**.

**Live app:** https://fast-api-ten-phi.vercel.app/

> **AI disclosure:** this project was built with the assistance of Claude Code (Anthropic).

## Key modelling decisions

- **Decision time:** a purchase for delivery day D is made on D-1 at a configurable cutoff (default **09:00 UTC**,
  adjustable in the UI). Data is in UTC, which equals UK time in January.
- **Latest forecast at decision time:** for every target hour of day D, the WINDFOR row with the greatest
  `publishTime` that is `<=` the cutoff. See `LatestBeforeCutoffSelector` in `backend/app/selection.py`.
- **Error** = forecast − actual (positive = over-forecast). WINDFOR is hourly, FUELHH half-hourly, so metrics compare
  at the hours where both exist (`startTime` on the hour).
- **Error band** on the decision page = forecast ± P90 absolute error of _earlier_ decisions only (no look-ahead).
- Demand is not in scope of the data, so the "buy" columns use a user-entered, illustrative demand figure.
- "Decisions in January" = decision dates 1–31 Jan 2026 (delivery days 2 Jan – 1 Feb).

## Metrics (accuracy tab)

MAE, RMSE, bias, MAPE, normalised MAE, P50/P90/P95 absolute error; broken down by day, hour of day, forecast lead
time (all forecast runs), plus an error histogram.

## Repository layout

```
backend/
  app/main.py          HTTP layer only (routes, validation, serves built frontend if FRONTEND_DIST set)
  app/dependencies.py  composition root: wires concrete classes together (dependency injection)
  app/services.py      use-cases: DecisionService, AccuracyService
  app/decisions.py     DecisionDataBuilder (decision-time forecast + actuals), error-band estimator
  app/selection.py     ForecastSelector strategy (latest forecast published before the cutoff)
  app/metrics.py       MetricsCalculator + pluggable metric registry
  app/breakdowns.py    accuracy breakdowns (daily, hour of day, lead time, histogram, series)
  app/repositories.py  ActualsSource / ForecastsSource protocols + CSV implementation
  scripts/ingest.py    downloads FUELHH + WINDFOR from Elexon into backend/data/*.csv
  scripts/smoke.py     prints headline metrics
  data/                snapshot of the Elexon data used by the app (committed so deployment needs no live API)
  tests/               pytest unit tests
frontend/src/
  api/                 WindApi interface + HttpWindApi (UI depends on the interface)
  context/             dependency injection (ApiProvider) and shared settings (cutoff, data window)
  hooks/               useAsync, data queries, theme
  lib/                 formatting, plain-language insight rules, date presets
  components/ui/       KPI tiles, cards (chart/table switch), callouts, controls, loading/error states
  components/charts/   shared chart kit + chart panels (Recharts)
  views/               DecisionView, AccuracyView, registry.ts (add a page by adding an entry)
api/index.py           Vercel serverless entrypoint
Dockerfile             multi-stage build: React build -> Python image serving API + static files
docker-compose.yml     local container run
vercel.json            Vercel build/routing config
requirements.txt       runtime Python dependencies
```

## Run it

**Docker (single container, http://localhost:8000):**

```
docker compose up --build
```

**Local dev (two terminals):**

```
# backend
pip install -r backend/requirements-dev.txt
cd backend && uvicorn app.main:app --reload --port 8001

# frontend (proxies /api to :8001)
cd frontend && npm install && npm run dev      # http://localhost:5173
```

**Refresh the data** (optional, needs internet): `python backend/scripts/ingest.py`

**Tests:** `cd backend && python -m pytest`

## Deploy to Vercel

Vercel builds from source (it does not run the Dockerfile): the React app becomes static files and `api/index.py`
becomes a Python serverless function that serves `/api/*`. Config is in `vercel.json`; the CSV data ships with the function.

```
npx vercel login
npx vercel            # first run: preview deployment, answer the prompts (framework: Other)
npx vercel --prod     # production URL
```

The Dockerfile is for local runs and container hosts (e.g. Heroku): `docker compose up --build`.

## API

- `GET /api/decision?decision_date=2026-01-15&cutoff=09:00` – delivery-day forecast, error band, runs used
- `GET /api/accuracy?from=2026-01-01&to=2026-01-31&cutoff=09:00` – metrics and chart series
