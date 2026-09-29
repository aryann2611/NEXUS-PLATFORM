import { useEffect, useState } from "react";
import { getReport } from "../services/api";
import type { Report, ReportRange } from "../types/report";
import type { LoadState } from "./useApis";

const REFRESH_MS = 60_000;

/** Loads a report and refreshes it every minute; keeps the last report on screen while refreshing. */
export function useReport(range: ReportRange, projectId?: string) {
  const [report, setReport] = useState<Report | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const next = await getReport(range, projectId);
        if (!active) return;
        setReport(next);
        setState("ready");
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Couldn't load the report.");
        setState("error");
      }
    }
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [range, projectId, attempt]);

  function reload() {
    setState("loading");
    setAttempt((n) => n + 1);
  }

  return { report, state, error, reload };
}
