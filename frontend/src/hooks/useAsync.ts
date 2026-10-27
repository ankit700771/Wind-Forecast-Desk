import { useEffect, useState } from "react";

export interface AsyncState<T> { data: T | null; error: string; loading: boolean }

/** Runs `load` whenever `deps` change. Keeps the previous data visible while reloading and ignores stale responses. */
export function useAsync<T>(load: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: "", loading: true });

  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true, error: "" }));
    load()
      .then((data) => live && setState({ data, error: "", loading: false }))
      .catch((e) => live && setState({ data: null, error: e instanceof Error ? e.message : String(e), loading: false }));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
