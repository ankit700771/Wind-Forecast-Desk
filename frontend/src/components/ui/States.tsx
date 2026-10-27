import { ReactNode } from "react";

export const Skeleton = ({ height = 280 }: { height?: number }) => <div className="skeleton" style={{ height }} />;

export const ErrorState = ({ message }: { message: string }) => (
  <div className="callout tone-warn" role="alert">
    <span className="callout-icon">!</span><div><strong>Something went wrong. </strong>{message}</div>
  </div>
);

/** Renders loading / error / content so views stay free of branching boilerplate. */
export function Async<T>({ state, children }: {
  state: { data: T | null; error: string; loading: boolean };
  children: (data: T) => ReactNode;
}) {
  if (state.error) return <ErrorState message={state.error} />;
  if (!state.data) return <div className="stack"><Skeleton height={90} /><Skeleton /><Skeleton height={200} /></div>;
  return <div className={`stack ${state.loading ? "stale" : ""}`}>{children(state.data)}</div>;
}
