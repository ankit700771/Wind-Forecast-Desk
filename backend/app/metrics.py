"""Error metrics. Add a metric by adding an entry to DEFAULT_METRICS; no existing code changes (OCP)."""
from typing import Callable, Mapping

import numpy as np
import pandas as pd

# A metric takes a frame with `actual` and `error` (forecast - actual) columns.
Metric = Callable[[pd.DataFrame], float]


def _abs_quantile(q: float) -> Metric:
    return lambda d: float(d["error"].abs().quantile(q))


DEFAULT_METRICS: Mapping[str, Metric] = {
    "mae": lambda d: float(d["error"].abs().mean()),
    "rmse": lambda d: float(np.sqrt((d["error"] ** 2).mean())),
    "bias": lambda d: float(d["error"].mean()),
    "mape": lambda d: float((d["error"].abs() / d["actual"].replace(0, np.nan)).mean() * 100),
    "p50_abs": _abs_quantile(0.5),
    "p90_abs": _abs_quantile(0.9),
    "p95_abs": _abs_quantile(0.95),
    "mean_actual": lambda d: float(d["actual"].mean()),
    "nmae": lambda d: float(d["error"].abs().mean() / d["actual"].mean() * 100),
}


class MetricsCalculator:
    def __init__(self, metrics: Mapping[str, Metric] = DEFAULT_METRICS):
        self._metrics = metrics

    def summarize(self, df: pd.DataFrame) -> dict:
        d = df.dropna(subset=["actual"])
        if d.empty:
            return {"n": 0}
        return {"n": int(len(d)), **{name: fn(d) for name, fn in self._metrics.items()}}
