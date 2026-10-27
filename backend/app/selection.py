"""Which forecast is 'the' forecast for a purchase decision? Strategy interface + default strategy."""
from datetime import date, datetime, time, timedelta, timezone
from typing import Protocol

import pandas as pd

UTC = timezone.utc


def decision_instant(decision_date: date, cutoff: time) -> pd.Timestamp:
    return pd.Timestamp(datetime.combine(decision_date, cutoff, tzinfo=UTC))


def delivery_window(decision_date: date) -> tuple[pd.Timestamp, pd.Timestamp]:
    """[start, end) of the delivery day, i.e. the day after the decision."""
    start = pd.Timestamp(datetime.combine(decision_date + timedelta(days=1), time(0), tzinfo=UTC))
    return start, start + pd.Timedelta(days=1)


class ForecastSelector(Protocol):
    def select(self, forecasts: pd.DataFrame, decision_date: date, cutoff: time) -> pd.DataFrame:
        """One forecast row per target hour of the delivery day, sorted by startTime."""


class LatestBeforeCutoffSelector:
    """Per target hour, the forecast with the greatest publishTime <= the decision cutoff."""

    def select(self, forecasts: pd.DataFrame, decision_date: date, cutoff: time) -> pd.DataFrame:
        start, end = delivery_window(decision_date)
        c = decision_instant(decision_date, cutoff)
        f = forecasts[(forecasts.startTime >= start) & (forecasts.startTime < end) & (forecasts.publishTime <= c)]
        f = f.sort_values("publishTime").groupby("startTime", as_index=False).last()
        return f.sort_values("startTime").reset_index(drop=True)
