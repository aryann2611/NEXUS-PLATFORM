import assert from "node:assert/strict";
import { test } from "node:test";
import type { CheckRow, DailyRow } from "../repositories/metrics.repository.js";
import { buildActivity, buildLatencySeries, buildUptimeHistory } from "./metrics.service.js";

const now = Date.parse("2026-06-10T12:30:00Z");
const check = (id: number, projectId: number, status: string, latency: number | null, iso: string) =>
  ({ id, project_id: projectId, name: `API ${projectId}`, status, latency_ms: latency, checked_at: new Date(iso) }) as CheckRow;

test("latency series has 24 hourly buckets with nearest-rank percentiles", () => {
  const checks = [100, 200, 300, 400, 1000].map((ms, i) => check(i, 1, "healthy", ms, "2026-06-10T12:10:00Z"));
  const series = buildLatencySeries(checks, now);
  assert.equal(series.length, 24);
  assert.equal(series[23].time, "2026-06-10T12:00:00.000Z");
  assert.deepEqual([series[23].p50, series[23].p95], [300, 1000]);
  assert.deepEqual([series[22].p50, series[22].p95], [null, null]);
});

test("uptime history marks days by healthy ratio and no-data days pending", () => {
  const daily = [
    { project_id: 1, day: "2026-06-10", total: 100, healthy_count: 100 },
    { project_id: 1, day: "2026-06-09", total: 100, healthy_count: 80 },
    { project_id: 1, day: "2026-06-08", total: 100, healthy_count: 10 },
  ] as DailyRow[];
  const [row] = buildUptimeHistory([{ id: "1", name: "API 1" }], daily, now);
  assert.equal(row.days.length, 45);
  assert.deepEqual(row.days.slice(-4), ["pending", "down", "degraded", "healthy"]);
  assert.equal(row.uptimePercent, 63.3);
});

test("activity labels recovery, latency and failures", () => {
  const latest = [
    check(4, 1, "healthy", 90, "2026-06-10T12:04:00Z"),
    check(3, 1, "down", null, "2026-06-10T12:03:00Z"),
    check(2, 1, "degraded", 1500, "2026-06-10T12:02:00Z"),
    check(1, 1, "healthy", 80, "2026-06-10T12:01:00Z"),
  ];
  assert.deepEqual(
    buildActivity(latest).map((e) => [e.event, e.details]),
    [["Recovered", "90ms"], ["Timeout", "No response"], ["High latency", "1500ms (threshold 1000ms)"], ["Health check", "80ms"]],
  );
});
