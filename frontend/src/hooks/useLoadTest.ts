import { useRef, useState } from "react";
import { getLoadTestHistory, saveLoadTestRun } from "../lib/loadTestHistory";
import { streamLoadTest } from "../services/loadTest";
import type { LoadTestInput, LoadTestRun, LoadTestSnapshot } from "../types/loadTest";

export type LoadTestState = "idle" | "running" | "done" | "error";

export function useLoadTest() {
  const [state, setState] = useState<LoadTestState>("idle");
  const [snapshot, setSnapshot] = useState<LoadTestSnapshot | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<LoadTestRun[]>(() => getLoadTestHistory());
  const controller = useRef<AbortController | null>(null);

  async function start(input: LoadTestInput) {
    controller.current?.abort();
    const ac = new AbortController();
    controller.current = ac;
    setState("running");
    setSnapshot(null);
    setError("");
    let last: LoadTestSnapshot | null = null;
    try {
      for await (const snap of streamLoadTest(input, ac.signal)) {
        last = snap;
        setSnapshot(snap);
      }
      if (!ac.signal.aborted) {
        setState("done");
        if (last) setHistory(saveLoadTestRun(input, last));
      }
    } catch (e) {
      if (ac.signal.aborted) return;
      setError(e instanceof Error ? e.message : "Load test failed.");
      setState("error");
    }
  }

  function cancel() {
    controller.current?.abort();
    setState((s) => (s === "running" ? "idle" : s));
  }

  return { state, snapshot, error, history, start, cancel };
}
