import { Accuracy, Decision, Meta } from "./types";

/** Contract the UI depends on. Swap the implementation (HTTP, mock, cache) without touching components. */
export interface WindApi {
  getMeta(): Promise<Meta>;
  getDecision(decisionDate: string, cutoff: string): Promise<Decision>;
  getAccuracy(from: string, to: string, cutoff: string): Promise<Accuracy>;
}

export class HttpWindApi implements WindApi {
  constructor(private readonly baseUrl = "") {}

  private async get<T>(path: string): Promise<T> {
    const r = await fetch(this.baseUrl + path);
    if (!r.ok) {
      let detail = "";
      try { detail = (await r.json()).detail; } catch { /* body was not JSON */ }
      throw new Error(detail || `Request failed (${r.status})`);
    }
    return r.json();
  }

  getMeta() { return this.get<Meta>("/api/meta"); }
  getDecision(d: string, cutoff: string) {
    return this.get<Decision>(`/api/decision?decision_date=${d}&cutoff=${cutoff}`);
  }
  getAccuracy(from: string, to: string, cutoff: string) {
    return this.get<Accuracy>(`/api/accuracy?from=${from}&to=${to}&cutoff=${cutoff}`);
  }
}
