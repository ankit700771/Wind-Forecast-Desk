import { ReactNode, useState } from "react";
import { Column, DataTable } from "./DataTable";

export function Card({ title, sub, children, className = "" }: { title?: string; sub?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {title && <h2>{title}</h2>}
      {sub && <p className="card-sub">{sub}</p>}
      {children}
    </section>
  );
}

interface ChartCardProps<T> {
  title: string; sub: string; children: ReactNode;
  /** Accessible alternative to the chart; every chart offers one. */
  table: { columns: Column<T>[]; rows: T[] };
  className?: string;
}

/** Card with a Chart / Table switch, so no chart is colour-only or hover-only. */
export function ChartCard<T>({ title, sub, children, table, className }: ChartCardProps<T>) {
  const [view, setView] = useState<"chart" | "table">("chart");
  return (
    <Card className={className}>
      <div className="card-head">
        <div><h2>{title}</h2><p className="card-sub">{sub}</p></div>
        <div className="seg" role="group" aria-label="View as">
          <button className={view === "chart" ? "on" : ""} onClick={() => setView("chart")}>Chart</button>
          <button className={view === "table" ? "on" : ""} onClick={() => setView("table")}>Table</button>
        </div>
      </div>
      {view === "chart" ? children : <DataTable columns={table.columns} rows={table.rows} />}
    </Card>
  );
}
