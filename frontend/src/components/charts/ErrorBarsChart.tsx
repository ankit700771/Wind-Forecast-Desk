import { Bar, BarChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { fmt, signed } from "../../lib/format";
import { ChartCard } from "../ui/Card";
import { Column } from "../ui/DataTable";
import { axis, barTooltip, chartLegend, CHART_HEIGHT, COLOR, grid, gwTick } from "./chartKit";

/**
 * One reusable "MAE (+ optional bias) per category" bar chart. Daily, lead-time and hour-of-day panels are
 * configurations of this component rather than three copies (open/closed).
 */
interface Row { label: string; mae: number; bias?: number; p90_abs?: number; n: number }

interface Props {
  title: string; sub: string; rows: Row[]; xLabel: string;
  series: { key: "mae" | "bias" | "p90_abs"; name: string; color: string }[];
  tickInterval?: number;
}

export function ErrorBarsChart({ title, sub, rows, xLabel, series, tickInterval = 0 }: Props) {
  const columns: Column<Row>[] = [
    { key: "l", label: xLabel, render: (r) => r.label },
    ...series.map((s) => ({
      key: s.key, label: `${s.name} (MW)`,
      render: (r: Row) => (s.key === "bias" ? signed(r[s.key] ?? 0) : fmt(r[s.key])),
    })),
    { key: "n", label: "Hours", render: (r) => fmt(r.n) },
  ];
  return (
    <ChartCard title={title} sub={sub} table={{ rows, columns }}>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT - 40}>
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
          {grid()}
          <XAxis dataKey="label" interval={tickInterval} {...axis} />
          <YAxis tickFormatter={gwTick} width={56} {...axis} axisLine={false} />
          <ReferenceLine y={0} stroke="var(--axis)" />
          {barTooltip()}
          {chartLegend()}
          {series.map((s) => <Bar isAnimationActive={false} key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={22} />)}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export const MAE = { key: "mae", name: "Typical miss (MAE)", color: COLOR.forecast } as const;
export const BIAS = { key: "bias", name: "Bias", color: COLOR.secondary } as const;
export const P90 = { key: "p90_abs", name: "Worst 10% (P90)", color: COLOR.secondary } as const;
