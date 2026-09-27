import { useEffect, useState } from "react";
import { getHealth } from "../services/api";
import type { BackendStatus, HealthResponse } from "../types/health";

export interface HealthState {
  status: BackendStatus;
  latencyMs: number | null;
  data: HealthResponse | null;
}

const RECHECK_MS = 30_000;

export function useHealth(): HealthState {
  const [state, setState] = useState<HealthState>({ status: "checking", latencyMs: null, data: null });

  useEffect(() => {
    let active = true;

    async function check() {
      const started = performance.now();
      try {
        const data = await getHealth();
        if (active) setState({ status: "connected", latencyMs: Math.round(performance.now() - started), data });
      } catch {
        if (active) setState({ status: "disconnected", latencyMs: null, data: null });
      }
    }

    check();
    const timer = setInterval(check, RECHECK_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return state;
}
