import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { HistogramBin } from "../../api/types";
import { fmt } from "../../lib/format";
import { ChartCard } from "../ui/Card";
import { axis, barTooltip, CHART_HEIGHT, COLOR, grid } from "./chartKit";

export function ErrorHistogram({ bins }: { bins: HistogramBin[] }) {
  const data = bins.map((b) => ({
    label: `${b.bin_start / 1000}`, range: `${fmt(b.bin_start)} to ${fmt(b.bin_end)} MW`,
    count: b.count, over: b.bin_start >= 0,
  }));
  return (
    <ChartCard
      title="How big are the misses?"
      sub="Hours grouped by error size in GW. Right of 0 = forecast too high, left = too low."
      table={{
        rows: data,
        columns: [
          { key: "r", label: "Error range", render: (r) => r.range },
          { key: "d", label: "Direction", render: (r) => (r.over ? "Over-forecast" : "Under-forecast") },
          { key: "c", label: "Hours", render: (r) => fmt(r.count) },
        ],
      }}
    >
      <ResponsiveContainer width="100%" height={CHART_HEIGHT - 40}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={2}>
          {grid()}
          <XAxis dataKey="label" {...axis} />
          <YAxis width={40} {...axis} axisLine={false} />
          <ReferenceLine x="0" stroke="var(--axis)" />
          {barTooltip({ unit: "hours", title: (l) => `Error from ${l} GW` })}
          <Bar isAnimationActive={false} dataKey="count" name="Hours" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.over ? COLOR.forecast : COLOR.secondary} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="legend-inline">
        <span><i style={{ background: COLOR.secondary }} /> Under-forecast</span>
        <span><i style={{ background: COLOR.forecast }} /> Over-forecast</span>
      </div>
    </ChartCard>
  );
}
