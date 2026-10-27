"""Data access. Consumers depend on the small Protocols (ISP, DIP), not on CSV files."""
from pathlib import Path
from typing import Optional, Protocol

import pandas as pd

DEFAULT_DATA_DIR = Path(__file__).resolve().parent.parent / "data"


class ActualsSource(Protocol):
    def actuals(self) -> pd.DataFrame:
        """Columns: startTime (UTC), generation (MW)."""


class ForecastsSource(Protocol):
    def forecasts(self) -> pd.DataFrame:
        """Columns: startTime (UTC), publishTime (UTC), generation (MW)."""


class CsvWindRepository:
    """Implements both sources from the CSV snapshots written by scripts/ingest.py."""

    def __init__(self, data_dir: Path = DEFAULT_DATA_DIR):
        self._dir = data_dir
        self._actuals: Optional[pd.DataFrame] = None
        self._forecasts: Optional[pd.DataFrame] = None

    def actuals(self) -> pd.DataFrame:
        if self._actuals is None:
            self._actuals = pd.read_csv(self._dir / "actuals.csv", parse_dates=["startTime"])
        return self._actuals

    def forecasts(self) -> pd.DataFrame:
        if self._forecasts is None:
            self._forecasts = pd.read_csv(self._dir / "forecasts.csv", parse_dates=["startTime", "publishTime"])
        return self._forecasts
