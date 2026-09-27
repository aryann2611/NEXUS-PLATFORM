import { spawn } from "node:child_process";
import { mkdtemp, open, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { LoadTestInput, LoadTestSnapshot } from "../types/loadTest.js";

// Constant-load script; k6 supplies the target URL, VU count and duration.
const K6_SCRIPT = `import http from 'k6/http';
export default function () {
  http.get(__ENV.TARGET_URL);
}
`;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.min(sorted.length - 1, Math.max(0, index))];
}

let k6Available: boolean | null = null;

/** Cached check that the k6 binary is on PATH. */
export async function ensureK6(): Promise<boolean> {
  if (k6Available !== null) return k6Available;
  k6Available = await new Promise<boolean>((resolve) => {
    const probe = spawn("k6", ["version"], { stdio: "ignore" });
    probe.on("error", () => resolve(false));
    probe.on("close", (code) => resolve(code === 0));
  });
  return k6Available;
}

// k6's `--out json` writes one JSON object per line; we only need these three metric points.
interface K6Point {
  type: string;
  metric: string;
  data: { value: number };
}

export async function* runLoadTest(input: LoadTestInput): AsyncGenerator<LoadTestSnapshot> {
  const dir = await mkdtemp(join(tmpdir(), "nexus-k6-"));
  const scriptPath = join(dir, "script.js");
  const outPath = join(dir, "out.json");
  await writeFile(scriptPath, K6_SCRIPT);

  const k6 = spawn(
    "k6",
    ["run", "--quiet", "--vus", String(input.vus), "--duration", `${input.durationSeconds}s`, "--out", `json=${outPath}`, "-e", `TARGET_URL=${input.url}`, scriptPath],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  const exited = new Promise<number>((resolve) => k6.on("close", (code) => resolve(code ?? 0)));

  const durationMs = input.durationSeconds * 1000;
  const started = Date.now();
  const latencies: number[] = [];
  let requests = 0;
  let errors = 0;

  // Incremental read: only parse bytes appended since the last tick.
  let offset = 0;
  let leftover = "";
  async function drain(final: boolean) {
    let file;
    try {
      file = await open(outPath, "r");
    } catch {
      return; // k6 hasn't created the file yet
    }
    try {
      const { size } = await file.stat();
      if (size > offset) {
        const buffer = Buffer.alloc(size - offset);
        await file.read(buffer, 0, buffer.length, offset);
        offset = size;
        leftover += buffer.toString("utf8");
      }
    } finally {
      await file.close();
    }
    const lines = leftover.split("\n");
    leftover = final ? "" : (lines.pop() ?? "");
    for (const line of lines) {
      if (!line) continue;
      let point: K6Point;
      try {
        point = JSON.parse(line);
      } catch {
        continue;
      }
      if (point.type !== "Point") continue;
      if (point.metric === "http_req_duration") latencies.push(point.data.value);
      else if (point.metric === "http_reqs") requests += point.data.value;
      else if (point.metric === "http_req_failed") errors += point.data.value;
    }
  }

  // ponytail: sorts the full latency list each tick — fine at the 50 VU / 60s caps; sample if you raise them.
  function snapshot(status: "running" | "done"): LoadTestSnapshot {
    const sorted = [...latencies].sort((a, b) => a - b);
    const elapsedMs = Date.now() - started;
    const seconds = Math.max(0.001, elapsedMs / 1000);
    const avg = latencies.length ? latencies.reduce((sum, v) => sum + v, 0) / latencies.length : 0;
    return {
      status,
      elapsedMs: Math.min(elapsedMs, durationMs),
      durationMs,
      requests,
      requestsPerSec: requests / seconds,
      avgLatencyMs: avg,
      p95Ms: percentile(sorted, 95),
      p99Ms: percentile(sorted, 99),
      errorRatePercent: requests ? (errors / requests) * 100 : 0,
    };
  }

  try {
    let running = true;
    exited.then(() => {
      running = false;
    });
    while (running) {
      await Promise.race([exited, delay(500)]);
      await drain(false);
      if (running) yield snapshot("running");
    }
    await drain(true);
    yield snapshot("done");
  } finally {
    k6.kill();
    await rm(dir, { recursive: true, force: true });
  }
}
