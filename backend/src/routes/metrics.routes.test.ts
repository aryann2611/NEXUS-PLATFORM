import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import type { Overview } from "../types/metrics.js";

process.env.DB_NAME = "nexus_test";

const { buildApp } = await import("../app.js");
const { pool } = await import("../db/database.js");
const { runMigrations } = await import("../db/migrator.js");

const app = await buildApp({ logger: false });

before(() => runMigrations(() => {}));
beforeEach(() => pool.query("DELETE FROM projects"));
after(() => app.close());

const getOverview = async () => (await app.inject({ method: "GET", url: "/api/metrics/overview" })).json<{ data: Overview }>().data;

async function addProject(name: string): Promise<number> {
  const [result] = await pool.query<import("mysql2").ResultSetHeader>("INSERT INTO projects (name, base_url) VALUES (?, 'https://example.com')", [name]);
  return result.insertId;
}

const addCheck = (id: number, status: string, latencyMs: number | null, minutesAgo: number) =>
  pool.query("INSERT INTO project_checks (project_id, status, latency_ms, checked_at) VALUES (?, ?, ?, DATE_SUB(NOW(), INTERVAL ? MINUTE))", [id, status, latencyMs, minutesAgo]);

test("overview is empty but well-formed with no checks", async () => {
  const data = await getOverview();
  assert.equal(data.summary.uptimePercent, null);
  assert.equal(data.summary.checks24h, 0);
  assert.equal(data.latencySeries.length, 24);
  assert.deepEqual(data.activity, []);
});

test("overview aggregates stored checks", async () => {
  const id = await addProject("Orders API");
  await addCheck(id, "down", null, 30);
  await addCheck(id, "healthy", 200, 20);
  await addCheck(id, "healthy", 100, 10);
  await addCheck(id, "degraded", 1500, 5);

  const data = await getOverview();
  assert.equal(data.summary.checks24h, 4);
  assert.equal(data.summary.uptimePercent, 50);
  assert.equal(data.summary.errorRatePercent, 25);
  assert.equal(data.summary.avgLatencyMs, 600);

  const populated = data.latencySeries.filter((point) => point.p50 !== null);
  assert.ok(populated.length >= 1 && populated.length <= 2);

  const row = data.uptimeHistory.find((r) => r.apiName === "Orders API")!;
  assert.equal(row.days.length, data.uptimeWindowDays);
  assert.equal(row.days.at(-1), "degraded", "today: 2 of 4 checks healthy");
  assert.equal(row.days[0], "pending");

  assert.deepEqual(
    data.activity.map((event) => event.event),
    ["High latency", "Recovered", "Health check", "Timeout"],
  );
});
