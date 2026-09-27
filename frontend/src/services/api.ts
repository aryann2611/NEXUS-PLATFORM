import type { HealthResponse } from "../types/health";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_URL}/api/health`, { signal: AbortSignal.timeout(5_000) });
  if (!res.ok) {
    throw new Error(`Health check failed with status ${res.status}`);
  }
  return res.json();
}
