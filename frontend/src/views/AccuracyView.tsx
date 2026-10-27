import { useState } from "react";
import { BIAS, ErrorBarsChart, MAE, P90 } from "../components/charts/ErrorBarsChart";
import { ErrorHistogram } from "../components/charts/ErrorHistogram";
import { ForecastVsActualChart } from "../components/charts/ForecastVsActualChart";
import { Callout, InsightList } from "../components/ui/Callout";
import { Card } from "../components/ui/Card";
import { ControlBar, Field } from "../components/ui/Controls";
import { Kpi, KpiRow } from "../components/ui/Kpi";
import { Async } from "../components/ui/States";
import { useSettings } from "../context/AppContext";
import { useAccuracy } from "../hooks/queries";
import { fmt, signed } from "../lib/format";
import { accuracyInsights } from "../lib/insights";
import { rangePresets } from "../lib/presets";

const GLOSSARY: [string, string][] = [
  ["Error", "Forecast minus actual. Positive = forecast too high (you would under-buy)."],
  ["MAE", "Mean absolute error: the average size of a miss, ignoring direction."],
  ["RMSE", "Like MAE but punishes big misses harder."],
  ["Bias", "Average signed error. Away from zero = the forecast is consistently high or low."],
  ["P90", "9 in 10 hours had an error smaller than this. A practical safety buffer."],
  ["Lead time", "Hours between a forecast being published and the hour it predicts."],
];

export default function AccuracyView() {
  const { meta, cutoff } = useSettings();
  const presets = rangePresets(meta);
  const [range, setRange] = useState({ from: presets[0].from, to: presets[0].to });
  const state = useAccuracy(range.from, range.to, cutoff);

  return (
    <>
      <ControlBar>
        <Field label="Decision dates">
          <div className="seg">
            {presets.map((p) => (
              <button key={p.label} className={p.from === range.from && p.to === range.to ? "on" : ""}
                onClick={() => setRange({ from: p.from, to: p.to })}>{p.label}</button>
            ))}
          </div>
        </Field>
        <Field label="From"><input type="date" value={range.from} min={meta.first_decision} max={range.to}
          onChange={(e) => e.target.value && setRange({ ...range, from: e.target.value })} /></Field>
        <Field label="To"><input type="date" value={range.to} min={range.from} max={meta.last_decision}
          onChange={(e) => e.target.value && setRange({ ...range, to: e.target.value })} /></Field>
      </ControlBar>

      <Async state={state}>
        {(a) => a.summary.n === 0 ? <Callout tone="warn">No data for this range.</Callout> : (
          <>
            <Callout tone={Math.abs(a.summary.bias) > 500 ? "warn" : "good"}>
              Across <b>{fmt(a.summary.n)}</b> hours, forecasts available the morning before delivery were off by
              {" "}<b>{fmt(a.summary.mae)} MW</b> on average ({fmt(a.summary.nmae, 0)}% of typical wind output)
              and <b>{a.summary.bias > 0 ? "over" : "under"}-estimated by {fmt(Math.abs(a.summary.bias))} MW</b> on average.
            </Callout>

            <KpiRow>
              <Kpi label="Typical miss (MAE)" value={fmt(a.summary.mae / 1000, 2)} unit=" GW"
                note={`${fmt(a.summary.nmae, 1)}% of mean wind`} hint="Mean absolute error" />
              <Kpi label="Big-miss measure (RMSE)" value={fmt(a.summary.rmse / 1000, 2)} unit=" GW"
                note="penalises large errors" />
              <Kpi label="Bias" value={signed(a.summary.bias / 1000, 2)} unit=" GW"
                tone={Math.abs(a.summary.bias) > 500 ? "warn" : "good"}
                note={a.summary.bias > 0 ? "forecast too high" : "forecast too low"} />
              <Kpi label="Safety buffer (P90)" value={fmt(a.summary.p90_abs / 1000, 2)} unit=" GW"
                note={`worst 5%: > ${fmt(a.summary.p95_abs / 1000, 1)} GW`} />
            </KpiRow>

            <div className="layout-2-1">
              <ForecastVsActualChart series={a.series} />
              <InsightList title="Key findings" insights={accuracyInsights(a)} />
            </div>

            <div className="grid-2">
              <ErrorBarsChart title="Is it getting better with fresher forecasts?"
                sub="Error by how long before the target hour the forecast was published."
                xLabel="Lead time" series={[MAE, BIAS]}
                rows={a.by_horizon.map((h) => ({ ...h, label: h.label }))} />
              <ErrorBarsChart title="Which hours are hardest?"
                sub="Error by hour of the delivery day (UTC)."
                xLabel="Hour (UTC)" series={[MAE, P90]} tickInterval={1}
                rows={a.by_hour.map((h) => ({ ...h, label: String(h.hour).padStart(2, "0") }))} />
              <ErrorBarsChart title="Day by day"
                sub="Bias and typical miss for each day's purchase decision."
                xLabel="Decision date" series={[MAE, BIAS]} tickInterval={a.daily.length > 16 ? 2 : 0}
                rows={a.daily.map((d) => ({ ...d, label: d.decisionDate.slice(8) + "/" + d.decisionDate.slice(5, 7) }))} />
              <ErrorHistogram bins={a.histogram} />
            </div>

            <Card title="Glossary" className="glossary">
              <dl>{GLOSSARY.map(([t, d]) => <div key={t}><dt>{t}</dt><dd>{d}</dd></div>)}</dl>
            </Card>
          </>
        )}
      </Async>
    </>
  );
}
