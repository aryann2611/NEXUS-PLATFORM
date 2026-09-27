import { useRef, useState } from "react";
import { streamLoadTest } from "../services/loadTest";
import type { LoadTestInput, LoadTestSnapshot } from "../types/loadTest";

export type LoadTestState = "idle" | "running" | "done" | "error";

export function useLoadTest() {
  const [state, setState] = useState<LoadTestState>("idle");
  const [snapshot, setSnapshot] = useState<LoadTestSnapshot | null>(null);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);

  async function start(input: LoadTestInput) {
    controller.current?.abort();
    const ac = new AbortController();
    controller.current = ac;
    setState("running");
    setSnapshot(null);
    setError("");
    try {
      for await (const snap of streamLoadTest(input, ac.signal)) {
        setSnapshot(snap);
      }
      if (!ac.signal.aborted) setState("done");
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

  return { state, snapshot, error, start, cancel };
}
