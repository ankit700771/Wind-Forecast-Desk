"""Builds decision-time forecasts joined with actuals, and estimates the error band for a decision."""
from dataclasses import dataclass
from datetime import date, time, timedelta
from typing import Protocol

import pandas as pd

from .repositories import ActualsSource, ForecastsSource
from .selection import ForecastSelector

_EMPTY_COLUMNS = ["startTime", "publishTime", "generation", "decisionDate", "actual", "error"]


class DecisionDataBuilder:
    """Decision-time forecast per decision date, joined with actuals. error = forecast - actual."""

    def __init__(self, forecasts: ForecastsSource, actuals: ActualsSource, selector: ForecastSelector):
        self._forecasts, self._actuals, self._selector = forecasts, actuals, selector

    def build(self, first: date, last: date, cutoff: time) -> pd.DataFrame:
        frames, d = [], first
        while d <= last:
            f = self._selector.select(self._forecasts.forecasts(), d, cutoff)
            if not f.empty:
                f["decisionDate"] = d
                frames.append(f)
            d += timedelta(days=1)
        if not frames:
            return pd.DataFrame(columns=_EMPTY_COLUMNS)
        df = pd.concat(frames, ignore_index=True)
        df = df.merge(self._actuals.actuals().rename(columns={"generation": "actual"}), on="startTime", how="left")
        df["error"] = df["generation"] - df["actual"]
        return df


@dataclass(frozen=True)
class ErrorBand:
    p90_abs: float
    bias: float
    basis: str


class ErrorBandEstimator(Protocol):
    def estimate(self, decision_date: date, cutoff: time) -> ErrorBand: ...


class PriorDecisionsBandEstimator:
    """Band from decisions made *before* the given one (no look-ahead); falls back to the full window."""

    def __init__(self, builder: DecisionDataBuilder, first: date, last: date, min_points: int = 24):
        self._builder, self._first, self._last, self._min = builder, first, last, min_points

    def estimate(self, decision_date: date, cutoff: time) -> ErrorBand:
        basis = "prior decisions in January"
        hist = self._builder.build(self._first, decision_date - timedelta(days=1), cutoff).dropna(subset=["actual"])
        if len(hist) < self._min:
            hist = self._builder.build(self._first, self._last, cutoff).dropna(subset=["actual"])
            basis = "all January decisions (insufficient prior history)"
        if hist.empty:
            return ErrorBand(0.0, 0.0, basis)
        return ErrorBand(float(hist["error"].abs().quantile(0.9)), float(hist["error"].mean()), basis)
