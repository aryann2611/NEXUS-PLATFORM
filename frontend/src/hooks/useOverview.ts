import { useEffect, useState } from "react";
import { getOverview } from "../services/api";
import type { Overview } from "../types/metrics";

const REFRESH_MS = 30_000;

/** Health-check metrics, refreshed in the background; `overview` stays on the last good value if a refresh fails. */
export function useOverview() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const load = () =>
      getOverview().then(
        (data) => active && (setOverview(data), setFailed(false)),
        () => active && setFailed(true),
      );
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return { overview, failed: failed && !overview };
}
