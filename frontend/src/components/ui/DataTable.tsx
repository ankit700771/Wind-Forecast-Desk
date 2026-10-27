import { ReactNode } from "react";

export interface Column<T> { key: string; label: string; render: (row: T) => ReactNode }

export function DataTable<T>({ columns, rows }: { columns: Column<T>[]; rows: T[] }) {
  return (
    <div className="tablewrap">
      <table>
        <thead><tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => <tr key={i}>{columns.map((c) => <td key={c.key}>{c.render(r)}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}
