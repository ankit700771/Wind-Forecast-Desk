import { Tone } from "../../lib/insights";

interface Props { label: string; value: string; unit?: string; note?: string; hint?: string; tone?: Tone }

export function Kpi({ label, value, unit, note, hint, tone = "info" }: Props) {
  return (
    <div className={`kpi tone-${tone}`} title={hint}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}{unit && <span className="kpi-unit">{unit}</span>}</div>
      {note && <div className="kpi-note">{note}</div>}
    </div>
  );
}

export const KpiRow = ({ children }: { children: React.ReactNode }) => <div className="kpis">{children}</div>;
