import { useMemo, useState } from "react";
import { DecisionRow } from "../api/types";
import { ForecastBandChart } from "../components/charts/ForecastBandChart";
import { Callout, InsightList } from "../components/ui/Callout";
import { Card } from "../components/ui/Card";
import { ControlBar, DateStepper, Field } from "../components/ui/Controls";
import { DataTable } from "../components/ui/DataTable";
import { Kpi, KpiRow } from "../components/ui/Kpi";
import { Async } from "../components/ui/States";
import { useSettings } from "../context/AppContext";
import { useDecision } from "../hooks/queries";
import { dayMonthTime, fmt, gw, hhmm, longDate, mw, shiftDate, signed } from "../lib/format";
import { decisionInsights } from "../lib/insights";

export default function DecisionView() {
  const { meta, cutoff } = useSettings();
  const [date, setDate] = useState("2026-01-15");
  const [demand, setDemand] = useState(15000);
  const [showActual, setShowActual] = useState(false);
  const [correct, setCorrect] = useState(false);
  const state = useDecision(date, cutoff);

  // Optional bias correction: shift the forecast and its band by the historical mean error.
  const rows: DecisionRow[] = useMemo(() => {
    const d = state.data;
    if (!d) return [];
    if (!correct) return d.rows;
    const b = d.error_bias;
    return d.rows.map((r) => ({
      ...r, forecast: Math.max(0, r.forecast - b), lower: Math.max(0, r.lower - b), upper: Math.max(0, r.upper - b),
    }));
  }, [state.data, correct]);

  const avg = rows.length ? rows.reduce((s, r) => s + r.forecast, 0) / rows.length : 0;

  return (
    <>
      <ControlBar>
        <Field label="Decision date (day you buy)">
          <DateStepper value={date} min={meta.first_decision} max={meta.last_decision} onChange={setDate} step={shiftDate} />
        </Field>
        <Field label="Expected demand for delivery day (MW)">
          <input type="number" step={500} min={0} value={demand} onChange={(e) => setDemand(Number(e.target.value))} />
        </Field>
        <label className="toggle"><input type="checkbox" checked={correct} onChange={(e) => setCorrect(e.target.checked)} />
          Correct for historical bias</label>
        <label className="toggle"><input type="checkbox" checked={showActual} onChange={(e) => setShowActual(e.target.checked)} />
          Reveal what actually happened</label>
      </ControlBar>

      <Async state={state}>
        {(d) => (
          <>
            <Callout tone="info">
              Buying on <b>{longDate(d.decision_date)}</b> at <b>{hhmm(d.cutoff)} UTC</b> for delivery on <b>{longDate(d.delivery_date)}</b>.
              {d.forecast_runs_used.length
                ? <> Using the newest forecast published before then: <b>{d.forecast_runs_used.map(dayMonthTime).join(", ")} UTC</b>.</>
                : <> No forecast had been published by then.</>}
            </Callout>

            <KpiRow>
              <Kpi label="Average wind forecast" value={fmt(avg / 1000, 1)} unit=" GW" note="over the delivery day" />
              <Kpi label="Average to procure" value={fmt(Math.max(0, demand - avg) / 1000, 1)} unit=" GW"
                note={`${gw(demand)} demand − wind`} hint="Demand minus forecast wind. Demand is a figure you enter." />
              <Kpi label="Likely forecast error" value={`± ${fmt(d.error_p90 / 1000, 1)}`} unit=" GW"
                note="9 in 10 past hours were closer than this" hint={d.error_basis} />
              <Kpi label="Past bias" value={signed(d.error_bias / 1000, 1)} unit=" GW"
                tone={Math.abs(d.error_bias) > 500 ? "warn" : "good"}
                note={d.error_bias > 0 ? "forecasts were too high" : "forecasts were too low"} />
            </KpiRow>

            <div className="layout-2-1">
              <ForecastBandChart rows={rows} showActual={showActual}
                title={correct ? "Wind forecast for delivery day (bias-corrected)" : "Wind forecast for delivery day"} />
              <InsightList title="What this means" insights={decisionInsights({ ...d, rows }, demand)} />
            </div>

            <Card title="Hour-by-hour buying guide"
              sub="Buy (central) assumes the forecast is right. Buy (if wind low) covers the bottom of the likely range. All MW.">
              <DataTable
                rows={rows}
                columns={[
                  { key: "h", label: "Hour (UTC)", render: (r) => hhmm(r.time) },
                  { key: "f", label: "Wind forecast", render: (r) => fmt(r.forecast) },
                  { key: "r", label: "Likely range", render: (r) => `${fmt(r.lower)} – ${fmt(r.upper)}` },
                  { key: "c", label: "Buy (central)", render: (r) => fmt(Math.max(0, demand - r.forecast)) },
                  { key: "w", label: "Buy (if wind low)", render: (r) => <b>{fmt(Math.max(0, demand - r.lower))}</b> },
                  { key: "p", label: "Forecast published", render: (r) => dayMonthTime(r.publishTime) },
                ]} />
              <p className="card-sub">Demand is a figure you enter: demand data is outside this pilot's scope ({mw(demand)} now).</p>
            </Card>
          </>
        )}
      </Async>
    </>
  );
}
