"""Download wind actuals (FUELHH) and forecasts (WINDFOR) from Elexon BMRS
and save them as compact CSVs in backend/data.

Scope: delivery days 2026-01-01 .. 2026-02-01 (UTC). Forecasts are pulled for
publish times from 2025-12-15 so every delivery day has D-1 forecasts.
"""
import csv
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import requests

BASE = "https://data.elexon.co.uk/bmrs/api/v1/datasets"
DATA = Path(__file__).resolve().parent.parent / "data"


def get(url, params):
    r = requests.get(url, params=params, timeout=120)
    r.raise_for_status()
    return r.json()


def fetch_actuals(start: date, end: date):
    rows, d = [], start
    while d <= end:
        nxt = min(d + timedelta(days=6), end)
        rows += get(f"{BASE}/FUELHH/stream", {
            "settlementDateFrom": d.isoformat(), "settlementDateTo": nxt.isoformat(),
            "fuelType": "WIND"})
        d = nxt + timedelta(days=1)
    return rows


def fetch_forecasts(start: datetime, end: datetime):
    rows, t = [], start
    while t < end:
        nxt = min(t + timedelta(days=2), end)
        rows += get(f"{BASE}/WINDFOR/stream", {
            "publishDateTimeFrom": t.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "publishDateTimeTo": nxt.strftime("%Y-%m-%dT%H:%M:%SZ")})
        t = nxt
    return rows


def write(path, fields, rows):
    seen, out = set(), []
    for r in rows:
        k = tuple(r[f] for f in fields[:-1])
        if k not in seen:
            seen.add(k)
            out.append(r)
    out.sort(key=lambda r: tuple(r[f] for f in fields[:-1]))
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(out)
    print(path.name, len(out), "rows")


if __name__ == "__main__":
    DATA.mkdir(exist_ok=True)
    utc = timezone.utc
    actuals = fetch_actuals(date(2025, 12, 31), date(2026, 2, 2))
    write(DATA / "actuals.csv", ["startTime", "generation"], actuals)
    fc = fetch_forecasts(datetime(2025, 12, 15, tzinfo=utc), datetime(2026, 2, 2, tzinfo=utc))
    write(DATA / "forecasts.csv", ["startTime", "publishTime", "generation"], fc)
