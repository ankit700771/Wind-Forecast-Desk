import { Meta } from "../api/types";
import { shiftDate } from "./format";

export interface RangePreset { label: string; from: string; to: string }

/** Quick date ranges for the accuracy view, derived from the data window. */
export function rangePresets(m: Meta): RangePreset[] {
  const mid = shiftDate(m.first_decision, 14);
  return [
    { label: "Full month", from: m.first_decision, to: m.last_decision },
    { label: "First half", from: m.first_decision, to: mid },
    { label: "Second half", from: shiftDate(mid, 1), to: m.last_decision },
    { label: "Last 7 days", from: shiftDate(m.last_decision, -6), to: m.last_decision },
  ];
}
