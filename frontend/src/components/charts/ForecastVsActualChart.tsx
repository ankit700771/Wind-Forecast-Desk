import { ComposedChart, Line, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { SeriesPoint } from "../../api/types";
import { dayMonthTime, fmt } from "../../lib/format";
import { ChartCard } from "../ui/Card";
import { axis, chartLegend, chartTooltip, CHART_HEIGHT, COLOR, grid, gwTick } from "./chartKit";

export function ForecastVsActualChart({ series }: { series: SeriesPoint[] }) {
  const data = series.map((p) => ({ ...p, t: dayMonthTime(p.time) }));
  return (
    <ChartCard
      className="span-full"
      title="Forecast vs what actually happened"
      sub="Each point is one hour of a delivery day, using the forecast available the morning before."
      table={{
        rows: data,
        columns: [
          { key: "t", label: "Hour (UTC)", render: (r) => r.t },
          { key: "f", label: "Forecast (MW)", render: (r) => fmt(r.forecast) },
          { key: "a", label: "Actual (MW)", render: (r) => fmt(r.actual) },
          { key: "e", label: "Error (MW)", render: (r) => fmt(r.error) },
        ],
      }}
    >
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          {grid()}
          <XAxis dataKey="t" minTickGap={70} {...axis} />
          <YAxis tickFormatter={gwTick} width={56} {...axis} axisLine={false} />
          {chartTooltip()}
          {chartLegend()}
          <Line isAnimationActive={false} dataKey="forecast" name="Forecast" stroke={COLOR.forecast} strokeWidth={1.75} dot={false} activeDot={{ r: 4 }} />
          <Line isAnimationActive={false} dataKey="actual" name="Actual" stroke={COLOR.actual} strokeWidth={1.75} dot={false} activeDot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
