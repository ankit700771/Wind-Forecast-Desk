"""Use-cases. Depend only on abstractions, injected through the constructor (DIP)."""
from datetime import date, time, timedelta
from typing import Sequence

import pandas as pd

from .breakdowns import AccuracyInput, Breakdown
from .decisions import DecisionDataBuilder, ErrorBandEstimator
from .metrics import MetricsCalculator
from .repositories import ActualsSource, ForecastsSource
from .selection import ForecastSelector, decision_instant


class DecisionService:
    """Delivery-day forecast available at decision time, with an error band."""

    def __init__(self, forecasts: ForecastsSource, actuals: ActualsSource,
                 selector: ForecastSelector, band: ErrorBandEstimator):
        self._forecasts, self._actuals, self._selector, self._band = forecasts, actuals, selector, band

    def view(self, decision_date: date, cutoff: time) -> dict:
        f = self._selector.select(self._forecasts.forecasts(), decision_date, cutoff)
        band = self._band.estimate(decision_date, cutoff)
        actual_by_time = self._actuals.actuals().set_index("startTime")["generation"]
        rows = []
        for r in f.itertuples():
            a = actual_by_time.get(r.startTime)
            rows.append({
                "time": r.startTime.isoformat(), "forecast": float(r.generation),
                "publishTime": r.publishTime.isoformat(),
                "lower": max(0.0, float(r.generation) - band.p90_abs), "upper": float(r.generation) + band.p90_abs,
                "actual": None if a is None or pd.isna(a) else float(a),
            })
        return {
            "decision_date": decision_date.isoformat(),
            "delivery_date": (decision_date + timedelta(days=1)).isoformat(),
            "cutoff": decision_instant(decision_date, cutoff).isoformat(),
            "forecast_runs_used": sorted({r["publishTime"] for r in rows}),
            "error_p90": band.p90_abs, "error_bias": band.bias, "error_basis": band.basis,
            "avg_forecast": float(f.generation.mean()) if len(f) else None,
            "rows": rows,
        }


class AccuracyService:
    """Summary metrics plus whichever breakdowns it was configured with."""

    def __init__(self, forecasts: ForecastsSource, actuals: ActualsSource, builder: DecisionDataBuilder,
                 calculator: MetricsCalculator, breakdowns: Sequence[Breakdown]):
        self._forecasts, self._actuals, self._builder = forecasts, actuals, builder
        self._calc, self._breakdowns = calculator, breakdowns

    def report(self, first: date, last: date, cutoff: time) -> dict:
        valid = self._builder.build(first, last, cutoff).dropna(subset=["actual"]).copy()
        out = {"summary": self._calc.summarize(valid)}
        data = AccuracyInput(valid, self._forecasts.forecasts(), self._actuals.actuals(), first, last)
        for b in self._breakdowns:
            out[b.key] = b.compute(data) if not valid.empty else []
        return out
