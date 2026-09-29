import { useEffect, useState } from "react";
import { getActivity } from "../services/api";
import type { ActivityItem } from "../types/activity";
import type { LoadState } from "./useApis";

const REFRESH_MS = 30_000;

/** Recent checks from the monitoring engine, refreshed every 30s. */
export function useActivity(limit: number, { changesOnly = false } = {}) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const next = await getActivity({ limit, changesOnly });
        if (!active) return;
        setItems(next);
        setState("ready");
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Couldn't load activity.");
        setState("error");
      }
    }
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [limit, changesOnly]);

  return { items, state, error };
}
