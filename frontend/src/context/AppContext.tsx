import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { WindApi, HttpWindApi } from "../api/WindApi";
import { Meta } from "../api/types";

/** Dependency injection for the data layer: components call useApi(), never fetch directly. */
const ApiContext = createContext<WindApi>(new HttpWindApi());
export const ApiProvider = ({ api, children }: { api?: WindApi; children: ReactNode }) => {
  const value = useMemo(() => api ?? new HttpWindApi(), [api]);
  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};
export const useApi = () => useContext(ApiContext);

/** Dashboard-wide settings shared by every view. */
interface Settings { meta: Meta; cutoff: string; setCutoff: (c: string) => void }
const SettingsContext = createContext<Settings | null>(null);

export const SettingsProvider = ({ meta, children }: { meta: Meta; children: ReactNode }) => {
  const [cutoff, setCutoff] = useState(meta.default_cutoff);
  const value = useMemo(() => ({ meta, cutoff, setCutoff }), [meta, cutoff]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export function useSettings(): Settings {
  const s = useContext(SettingsContext);
  if (!s) throw new Error("useSettings must be used inside SettingsProvider");
  return s;
}
