from datetime import date, time

import pandas as pd

from app.breakdowns import DailyBreakdown, LeadTimeBreakdown, SeriesBreakdown
from app.decisions import DecisionDataBuilder
from app.metrics import MetricsCalculator
from app.selection import LatestBeforeCutoffSelector
from app.services import AccuracyService


def mk(rows):
    return pd.DataFrame(rows, columns=["startTime", "publishTime", "generation"]).assign(
        startTime=lambda d: pd.to_datetime(d.startTime, utc=True),
        publishTime=lambda d: pd.to_datetime(d.publishTime, utc=True))


F = mk([
    ("2026-01-02T00:00Z", "2026-01-01T07:30Z", 100),
    ("2026-01-02T00:00Z", "2026-01-01T09:30Z", 200),   # after 09:00 cutoff
    ("2026-01-02T00:00Z", "2026-01-01T02:30Z", 50),    # older
    ("2026-01-02T01:00Z", "2026-01-01T07:30Z", 110),
    ("2026-01-03T00:00Z", "2026-01-01T07:30Z", 999),   # other delivery day
])
A = pd.DataFrame({"startTime": pd.to_datetime(["2026-01-02T00:00Z", "2026-01-02T01:00Z"], utc=True),
                  "generation": [90, 130]})


class InMemorySource:
    """Test double satisfying both ActualsSource and ForecastsSource (DIP in action)."""

    def __init__(self, actuals, forecasts):
        self._a, self._f = actuals, forecasts

    def actuals(self):
        return self._a

    def forecasts(self):
        return self._f


SEL = LatestBeforeCutoffSelector()
SRC = InMemorySource(A, F)


def test_latest_before_cutoff():
    assert list(SEL.select(F, date(2026, 1, 1), time(9, 0)).generation) == [100, 110]


def test_later_cutoff_picks_newer_run():
    assert list(SEL.select(F, date(2026, 1, 1), time(9, 30)).generation) == [200, 110]


def test_no_forecasts_before_cutoff_is_empty():
    assert SEL.select(F, date(2026, 1, 1), time(1, 0)).empty


def test_error_is_forecast_minus_actual():
    df = DecisionDataBuilder(SRC, SRC, SEL).build(date(2026, 1, 1), date(2026, 1, 1), time(9, 0))
    assert list(df.error) == [10, -20]


def test_summary_metrics():
    calc = MetricsCalculator()
    df = DecisionDataBuilder(SRC, SRC, SEL).build(date(2026, 1, 1), date(2026, 1, 1), time(9, 0))
    s = calc.summarize(df)
    assert s["n"] == 2 and s["mae"] == 15 and s["bias"] == -5
    assert abs(s["rmse"] - 250 ** 0.5) < 1e-9


def test_custom_metric_needs_no_code_change():  # open/closed
    calc = MetricsCalculator({"max_abs": lambda d: float(d["error"].abs().max())})
    df = DecisionDataBuilder(SRC, SRC, SEL).build(date(2026, 1, 1), date(2026, 1, 1), time(9, 0))
    assert calc.summarize(df) == {"n": 2, "max_abs": 20.0}


def test_accuracy_service_runs_only_configured_breakdowns():
    calc = MetricsCalculator()
    svc = AccuracyService(SRC, SRC, DecisionDataBuilder(SRC, SRC, SEL), calc,
                          [SeriesBreakdown(), DailyBreakdown(calc), LeadTimeBreakdown(calc)])
    out = svc.report(date(2026, 1, 1), date(2026, 1, 1), time(9, 0))
    assert set(out) == {"summary", "series", "daily", "by_horizon"}
    assert len(out["series"]) == 2 and out["daily"][0]["decisionDate"] == "2026-01-01"
