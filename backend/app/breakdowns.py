"""Accuracy breakdowns. Each one is an independent strategy; add a new one by writing a class (OCP, SRP)."""
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from typing import Protocol, Sequence

import numpy as np
import pandas as pd

from .metrics import MetricsCalculator
from .selection import UTC


@dataclass(frozen=True)
class AccuracyInput:
    decisions: pd.DataFrame   # decision-time forecasts with actuals, empty rows removed
    forecasts: pd.DataFrame   # every forecast run
    actuals: pd.DataFrame
    first: date
    last: date


class Breakdown(Protocol):
    key: str

    def compute(self, data: AccuracyInput) -> list: ...


class SeriesBreakdown:
    key = "series"

    def compute(self, data: AccuracyInput) -> list:
        return [{"time": r.startTime.isoformat(), "forecast": r.generation, "actual": r.actual, "error": r.error}
                for r in data.decisions.itertuples()]


class DailyBreakdown:
    key = "daily"

    def __init__(self, calc: MetricsCalculator):
        self._calc = calc

    def compute(self, data: AccuracyInput) -> list:
        return [{"decisionDate": d.isoformat(), **self._calc.summarize(g)}
                for d, g in data.decisions.groupby("decisionDate")]


class HourOfDayBreakdown:
    key = "by_hour"

    def __init__(self, calc: MetricsCalculator):
        self._calc = calc

    def compute(self, data: AccuracyInput) -> list:
        hours = data.decisions.startTime.dt.hour
        return [{"hour": int(h), **self._calc.summarize(g)} for h, g in data.decisions.groupby(hours)]


class HistogramBreakdown:
    key = "histogram"

    def __init__(self, limit: int = 8000, width: int = 1000):
        self._edges = np.arange(-limit, limit + 1, width)

    def compute(self, data: AccuracyInput) -> list:
        lim = self._edges[-1] - 1
        counts, _ = np.histogram(data.decisions["error"].clip(-lim, lim), bins=self._edges)
        return [{"bin_start": int(self._edges[i]), "bin_end": int(self._edges[i + 1]), "count": int(c)}
                for i, c in enumerate(counts)]


class LeadTimeBreakdown:
    """Error vs hours between publication and target, over every forecast run (not only decision-time ones)."""
    key = "by_horizon"

    def __init__(self, calc: MetricsCalculator, bins: Sequence[int] = (0, 12, 24, 36, 48, 72)):
        self._calc, self._bins = calc, list(bins)

    def compute(self, data: AccuracyInput) -> list:
        lo = pd.Timestamp(datetime.combine(data.first + timedelta(days=1), time(0), tzinfo=UTC))
        hi = pd.Timestamp(datetime.combine(data.last + timedelta(days=2), time(0), tzinfo=UTC))
        f = data.forecasts[(data.forecasts.startTime >= lo) & (data.forecasts.startTime < hi)]
        f = f.merge(data.actuals.rename(columns={"generation": "actual"}), on="startTime", how="inner")
        f["horizon"] = (f.startTime - f.publishTime).dt.total_seconds() / 3600
        f["error"] = f["generation"] - f["actual"]
        f = f[f.horizon >= 0]
        f["bin"] = pd.cut(f.horizon, self._bins, right=False)
        return [{"label": f"{int(b.left)}-{int(b.right)}h", "from_h": int(b.left), "to_h": int(b.right),
                 **self._calc.summarize(g)} for b, g in f.groupby("bin", observed=True)]
