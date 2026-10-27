import { CartesianGrid, Legend, Tooltip } from "recharts";
import { fmt } from "../../lib/format";

/** Colour roles (CSS variables, themed in styles.css). Series colours follow the entity, not rank. */
export const COLOR = {
  forecast: "var(--c-forecast)",
  actual: "var(--c-actual)",
  secondary: "var(--c-secondary)",
};

export const axis = {
  stroke: "var(--axis)",
  tick: { fill: "var(--text-2)", fontSize: 12 },
  tickLine: false as const,
};
export const gwTick = (v: number) => `${fmt(v / 1000, Number.isInteger(v / 1000) ? 0 : 1)} GW`;
export const CHART_HEIGHT = 300;

// Recharts only recognises Legend/Tooltip/Grid as direct children, so these are element factories, not components.
export const grid = () => <CartesianGrid stroke="var(--grid)" vertical={false} />;

export const chartLegend = () => (
  <Legend verticalAlign="top" align="right" height={32} iconType="circle" iconSize={8}
    formatter={(v: string) => <span style={{ color: "var(--text-2)", fontSize: 12 }}>{v}</span>} />
);

interface TipProps {
  active?: boolean;
  payload?: { name: string; value: number | [number, number]; color?: string; stroke?: string; fill?: string }[];
  label?: string | number;
  unit?: string;
  title?: (label: string | number) => string;
}

function TooltipBody({ active, payload, label, unit = "MW", title }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tip">
      <div className="tip-title">{title ? title(label ?? "") : label}</div>
      {payload.map((p) => (
        <div className="tip-row" key={p.name}>
          <i style={{ background: p.stroke && p.stroke !== "none" ? p.stroke : p.fill ?? p.color }} />
          <span>{p.name}</span>
          <b>{Array.isArray(p.value) ? `${fmt(p.value[0])} – ${fmt(p.value[1])}` : fmt(p.value)} {unit}</b>
        </div>
      ))}
    </div>
  );
}

/** Hover layer shared by every chart (vertical crosshair + themed tooltip). */
export const chartTooltip = (props: Omit<TipProps, "active" | "payload" | "label"> = {}) => (
  <Tooltip content={<TooltipBody {...props} />} cursor={{ stroke: "var(--axis)", strokeDasharray: "3 3" }} />
);

export const barTooltip = (props: Omit<TipProps, "active" | "payload" | "label"> = {}) => (
  <Tooltip content={<TooltipBody {...props} />} cursor={{ fill: "var(--grid)", opacity: 0.5 }} />
);
