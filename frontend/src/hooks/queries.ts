import { useApi } from "../context/AppContext";
import { useAsync } from "./useAsync";

export const useDecision = (date: string, cutoff: string) => {
  const api = useApi();
  return useAsync(() => api.getDecision(date, cutoff), [api, date, cutoff]);
};

export const useAccuracy = (from: string, to: string, cutoff: string) => {
  const api = useApi();
  return useAsync(() => api.getAccuracy(from, to, cutoff), [api, from, to, cutoff]);
};
