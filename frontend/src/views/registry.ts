import { ComponentType } from "react";
import AccuracyView from "./AccuracyView";
import DecisionView from "./DecisionView";

export interface ViewDef { id: string; label: string; hint: string; component: ComponentType }

/** Add a dashboard page by adding an entry here; App and the nav need no changes. */
export const VIEWS: ViewDef[] = [
  { id: "decision", label: "Tomorrow's decision", hint: "What to expect and how much to buy", component: DecisionView },
  { id: "accuracy", label: "Forecast accuracy", hint: "How reliable the forecasts have been", component: AccuracyView },
];
