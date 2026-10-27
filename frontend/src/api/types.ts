export interface Meta { first_decision: string; last_decision: string; default_cutoff: string }

export interface DecisionRow {
  time: string; forecast: number; publishTime: string; lower: number; upper: number; actual: number | null;
}
export interface Decision {
  decision_date: string; delivery_date: string; cutoff: string; forecast_runs_used: string[];
  error_p90: number; error_bias: number; error_basis: string; avg_forecast: number | null; rows: DecisionRow[];
}

export interface Metrics {
  n: number; mae: number; rmse: number; bias: number; mape: number; p50_abs: number; p90_abs: number;
  p95_abs: number; mean_actual: number; nmae: number;
}
export interface SeriesPoint { time: string; forecast: number; actual: number; error: number }
export type DailyMetrics = Metrics & { decisionDate: string };
export type HourMetrics = Metrics & { hour: number };
export type LeadTimeMetrics = Metrics & { label: string };
export interface HistogramBin { bin_start: number; bin_end: number; count: number }

export interface Accuracy {
  summary: Metrics;
  series: SeriesPoint[];
  daily: DailyMetrics[];
  by_hour: HourMetrics[];
  by_horizon: LeadTimeMetrics[];
  histogram: HistogramBin[];
}
