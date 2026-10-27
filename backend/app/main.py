"""HTTP layer only: parse/validate input, delegate to services, return their result."""
import os
from datetime import date, time
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .dependencies import Settings, get_accuracy_service, get_decision_service, get_settings
from .services import AccuracyService, DecisionService

app = FastAPI(title="Wind Forecast Decision Support API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET"])


def parse_cutoff(s: str) -> time:
    try:
        h, m = s.split(":")
        return time(int(h), int(m))
    except ValueError:
        raise HTTPException(422, "cutoff must be HH:MM (UTC)")


def check_date(d: date, s: Settings):
    if not s.first_decision <= d <= s.last_decision:
        raise HTTPException(422, f"decision date must be within {s.first_decision}..{s.last_decision}")


@app.get("/api/meta")
def meta(s: Settings = Depends(get_settings)):
    return {"first_decision": s.first_decision.isoformat(), "last_decision": s.last_decision.isoformat(),
            "default_cutoff": s.default_cutoff}


@app.get("/api/decision")
def decision(decision_date: date, cutoff: str | None = None, s: Settings = Depends(get_settings),
             svc: DecisionService = Depends(get_decision_service)):
    check_date(decision_date, s)
    return svc.view(decision_date, parse_cutoff(cutoff or s.default_cutoff))


@app.get("/api/accuracy")
def accuracy(from_date: date | None = Query(None, alias="from"), to_date: date | None = Query(None, alias="to"),
             cutoff: str | None = None, s: Settings = Depends(get_settings),
             svc: AccuracyService = Depends(get_accuracy_service)):
    first, last = from_date or s.first_decision, to_date or s.last_decision
    check_date(first, s)
    check_date(last, s)
    if last < first:
        raise HTTPException(422, "'to' must be >= 'from'")
    return svc.report(first, last, parse_cutoff(cutoff or s.default_cutoff))


# In the Docker image the built React app is served by the same process.
_dist = os.environ.get("FRONTEND_DIST")
if _dist and Path(_dist).is_dir():
    app.mount("/", StaticFiles(directory=_dist, html=True), name="frontend")
