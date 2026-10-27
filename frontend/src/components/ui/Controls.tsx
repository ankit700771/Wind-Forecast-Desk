import { ReactNode } from "react";

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="field"><span>{label}</span>{children}</label>
);

export const ControlBar = ({ children }: { children: ReactNode }) => <div className="controlbar">{children}</div>;

/** Date input with previous/next-day buttons. */
export function DateStepper({ value, min, max, onChange, step }: {
  value: string; min: string; max: string; onChange: (v: string) => void; step: (v: string, d: number) => string;
}) {
  return (
    <div className="stepper">
      <button aria-label="Previous day" disabled={value <= min} onClick={() => onChange(step(value, -1))}>‹</button>
      <input type="date" value={value} min={min} max={max} onChange={(e) => e.target.value && onChange(e.target.value)} />
      <button aria-label="Next day" disabled={value >= max} onClick={() => onChange(step(value, 1))}>›</button>
    </div>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: {
  options: { id: T; label: string }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o.id} className={o.id === value ? "on" : ""} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  );
}
