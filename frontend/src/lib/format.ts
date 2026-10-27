export const fmt = (v: number | null | undefined, d = 0) =>
  v == null ? "–" : v.toLocaleString("en-GB", { maximumFractionDigits: d, minimumFractionDigits: d });
export const signed = (v: number, d = 0) => `${v >= 0 ? "+" : "−"}${fmt(Math.abs(v), d)}`;
export const gw = (v: number, d = 1) => `${fmt(v / 1000, d)} GW`;
export const mw = (v: number) => `${fmt(v)} MW`;

export const hhmm = (iso: string) => iso.slice(11, 16);
export const dayMonthTime = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)} ${iso.slice(11, 16)}`;
export const longDate = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", timeZone: "UTC",
  });

export const shiftDate = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
export const clampDate = (iso: string, min: string, max: string) => (iso < min ? min : iso > max ? max : iso);
