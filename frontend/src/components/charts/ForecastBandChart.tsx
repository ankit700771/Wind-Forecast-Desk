import { Area, ComposedChart, Line, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { DecisionRow } from "../../api/types";
import { fmt, hhmm } from "../../lib/format";
import { ChartCard } from "../ui/Card";
import { axis, chartLegend, chartTooltip, CHART_HEIGHT, COLOR, grid, gwTick } from "./chartKit";

interface Props { rows: DecisionRow[]; showActual: boolean; title: string }

export function ForecastBandChart({ rows, showActual, title }: Props) {
  const data = rows.map((r) => ({
    t: hhmm(r.time), forecast: r.forecast, band: [r.lower, r.upper] as [number, number], actual: r.actual,
  }));
  return (
    <ChartCard
      title={title}
      sub="Line = forecast known at decision time. Shaded band = where 9 in 10 past forecasts would have landed."
      table={{
        rows: data,
        columns: [
          { key: "t", label: "Hour (UTC)", render: (r) => r.t },
          { key: "f", label: "Forecast (MW)", render: (r) => fmt(r.forecast) },
          { key: "b", label: "Range (MW)", render: (r) => `${fmt(r.band[0])} – ${fmt(r.band[1])}` },
          { key: "a", label: "Actual (MW)", render: (r) => fmt(r.actual) },
        ],
      }}
    >
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          {grid()}
          <XAxis dataKey="t" interval={2} {...axis} />
          <YAxis tickFormatter={gwTick} width={56} {...axis} axisLine={false} />
          {chartTooltip()}
          {chartLegend()}
          <Area isAnimationActive={false} dataKey="band" name="Likely range (P90)" stroke="none" fill={COLOR.forecast} fillOpacity={0.14} />
          <Line isAnimationActive={false} dataKey="forecast" name="Forecast" stroke={COLOR.forecast} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          {showActual && (
            <Line isAnimationActive={false} dataKey="actual" name="Actual (hindsight)" stroke={COLOR.actual} strokeWidth={2}
              strokeDasharray="5 4" dot={false} activeDot={{ r: 4 }} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
