import { Accuracy, Decision } from "../api/types";
import { fmt, gw, hhmm, mw } from "./format";

export type Tone = "good" | "warn" | "info";
export interface Insight { tone: Tone; title: string; text: string }

/** Plain-language takeaways, derived from the numbers so the dashboard explains itself. */
export function accuracyInsights(a: Accuracy): Insight[] {
  const s = a.summary;
  if (!s.n) return [];
  const out: Insight[] = [];
  const biasShare = Math.abs(s.bias) / s.mean_actual;

  out.push(Math.abs(s.bias) > 500
    ? { tone: "warn", title: s.bias > 0 ? "Forecasts run too high" : "Forecasts run too low",
        text: `On average the forecast ${s.bias > 0 ? "over" : "under"}-estimated wind by ${mw(Math.abs(s.bias))} (${fmt(biasShare * 100, 0)}% of typical output). ` +
              (s.bias > 0 ? "Relying on it unadjusted means buying too little." : "Relying on it unadjusted means buying too much.") }
    : { tone: "good", title: "No systematic bias", text: `Over- and under-forecasts roughly cancel out (average ${mw(s.bias)}).` });

  out.push({ tone: "info", title: "Size of a typical miss",
    text: `Half of all hours were within ${mw(s.p50_abs)} of actual and 9 in 10 within ${mw(s.p90_abs)}. Use the 90% figure as a safety buffer.` });

  const lt = a.by_horizon.filter((h) => h.n);
  if (lt.length > 1) {
    const first = lt[0], last = lt[lt.length - 1];
    out.push({ tone: last.mae > first.mae * 1.1 ? "warn" : "info", title: "Fresher forecasts are better",
      text: `Error grows from ${mw(first.mae)} (published ${first.label} before) to ${mw(last.mae)} (${last.label} before). Buy as late as possible with the newest run.` });
  }

  if (a.by_hour.length) {
    const worst = a.by_hour.reduce((m, h) => (h.mae > m.mae ? h : m));
    out.push({ tone: "info", title: "Hardest hour to call",
      text: `${String(worst.hour).padStart(2, "0")}:00 UTC has the largest typical error (${mw(worst.mae)}).` });
  }
  return out;
}

export function decisionInsights(d: Decision, demand: number): Insight[] {
  if (!d.rows.length) return [];
  const out: Insight[] = [];
  const low = d.rows.reduce((m, r) => (r.forecast < m.forecast ? r : m));
  const peakBuy = Math.max(...d.rows.map((r) => demand - r.lower));

  out.push({ tone: "info", title: "Tightest hour",
    text: `${hhmm(low.time)} UTC has the least wind (${gw(low.forecast)} forecast, as low as ${gw(low.lower)}). Cover this hour first.` });
  out.push({ tone: "info", title: "Worst-case purchase",
    text: `If wind lands at the bottom of its range you may need up to ${mw(Math.max(0, peakBuy))} at the peak hour (for ${mw(demand)} demand).` });
  if (Math.abs(d.error_bias) > 500) {
    out.push({ tone: "warn", title: d.error_bias > 0 ? "History says wind may disappoint" : "History says wind may surprise upward",
      text: `Past forecasts were ${mw(Math.abs(d.error_bias))} ${d.error_bias > 0 ? "too high" : "too low"} on average. Try the bias-corrected view.` });
  }
  return out;
}
