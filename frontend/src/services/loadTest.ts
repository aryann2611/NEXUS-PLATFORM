import { API_URL } from "./api";
import type { LoadTestInput, LoadTestSnapshot } from "../types/loadTest";

// Reads the backend's newline-delimited JSON stream and yields each live snapshot.
export async function* streamLoadTest(input: LoadTestInput, signal: AbortSignal): AsyncGenerator<LoadTestSnapshot> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/load-tests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal,
    });
  } catch {
    if (signal.aborted) return;
    throw new Error("Can't reach the NEXUS API. Is the backend running?");
  }

  if (!res.ok || !res.body) {
    const body: unknown = await res.json().catch(() => null);
    const message = (body as { error?: { message?: string } } | null)?.error?.message;
    throw new Error(message ?? `Request failed with status ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) if (line.trim()) yield JSON.parse(line) as LoadTestSnapshot;
  }
}
