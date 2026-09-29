import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, test } from "node:test";
import type { Project } from "../types/project.js";
import type { Report } from "../types/report.js";

// Integration tests against a real MySQL database; set before env.ts loads.
process.env.DB_NAME = "nexus_test";
process.env.MONITOR_ALLOW_PRIVATE_TARGETS = "true";

const { buildApp } = await import("../app.js");
const { pool } = await import("../db/database.js");
const { runMigrations } = await import("../db/migrator.js");
const { runDueChecks } = await import("../monitoring/worker.js");

const app = await buildApp({ logger: false });
let target: Server;
let targetUrl: string;

before(async () => {
  await runMigrations(() => {});
  target = createServer((_req, res) => res.end("ok"));
  await new Promise<void>((resolve) => target.listen(0, "127.0.0.1", resolve));
  targetUrl = `http://127.0.0.1:${(target.address() as AddressInfo).port}`;
});
beforeEach(() => pool.query("DELETE FROM projects"));
after(async () => {
  target.close();
  await app.close();
});

type ErrorBody = { error: { message: string } };

async function createProject(name: string, baseUrl = "https://api.example.com"): Promise<Project> {
  const res = await app.inject({ method: "POST", url: "/api/projects", payload: { name, baseUrl } });
  return res.json<{ data: Project }>().data;
}

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);

async function insertCheck(projectId: string, at: Date, outcome: string, latencyMs: number | null, error: string | null = null) {
  await pool.query("INSERT INTO checks (project_id, checked_at, outcome, status_code, latency_ms, error) VALUES (?, ?, ?, ?, ?, ?)", [
    projectId, at, outcome, latencyMs === null ? null : 200, latencyMs, error,
  ]);
}

async function getReport(query = ""): Promise<Report> {
  const res = await app.inject({ method: "GET", url: `/api/reports${query}` });
  assert.equal(res.statusCode, 200, res.body);
  return res.json<{ data: Report }>().data;
}

async function seedChecks() {
  const api = await createProject("Orders API");
  const idle = await createProject("Idle API");
  await insertCheck(api.id, minutesAgo(2 * 24 * 60), "healthy", 90); // outside 24h, inside 7d
  await insertCheck(api.id, minutesAgo(50), "healthy", 100);
  await insertCheck(api.id, minutesAgo(40), "healthy", 200);
  await insertCheck(api.id, minutesAgo(30), "down", null, "Connection refused");
  await insertCheck(api.id, minutesAgo(20), "down", 50, "HTTP 503");
  await insertCheck(api.id, minutesAgo(10), "healthy", 300);
  await insertCheck(api.id, minutesAgo(5), "degraded", 1500);
  return { api, idle };
}

test("GET /api/reports aggregates uptime, latency percentiles and incidents", async () => {
  const { api, idle } = await seedChecks();
  const report = await getReport("?range=24h");

  assert.equal(report.range, "24h");
  assert.equal(report.buckets.length, 24);
  assert.equal(report.bucketSeconds, 3600);

  const orders = report.apis.find((a) => a.id === api.id)!;
  assert.equal(orders.checks, 6);
  assert.equal(orders.failedChecks, 2);
  assert.equal(orders.uptimePercent, 66.67);
  assert.deepEqual(orders.latency, { avg: 430, p50: 200, p95: 1500, p99: 1500, min: 50, max: 1500 });
  assert.equal(orders.incidents, 2);
  assert.equal(orders.downtimeSeconds, 1200);
  assert.equal(orders.history.length, 24);
  assert.ok(orders.history.includes("down"));

  const quiet = report.apis.find((a) => a.id === idle.id)!;
  assert.equal(quiet.checks, 0);
  assert.equal(quiet.uptimePercent, null);
  assert.equal(quiet.latency.p95, null);
  assert.ok(quiet.history.every((h) => h === null));

  assert.equal(report.totals.apis, 2);
  assert.equal(report.totals.checks, 6);
  assert.equal(report.totals.uptimePercent, 66.67);
  assert.equal(report.totals.downtimeSeconds, 1200);
  assert.equal(report.buckets.reduce((n, b) => n + b.checks, 0), 6);
});

test("incidents group consecutive failures and are newest first", async () => {
  const { api } = await seedChecks();
  const [ongoing, resolved] = (await getReport("?range=24h")).incidents;

  assert.equal(ongoing.apiId, api.id);
  assert.equal(ongoing.severity, "degraded");
  assert.equal(ongoing.resolvedAt, null);
  assert.equal(ongoing.checks, 1);
  assert.ok(Math.abs(ongoing.durationSeconds - 300) < 5);

  assert.equal(resolved.severity, "down");
  assert.equal(resolved.checks, 2);
  assert.equal(resolved.durationSeconds, 1200);
  assert.equal(resolved.lastError, "HTTP 503");
  assert.ok(resolved.resolvedAt);
});

test("the range controls which checks are included", async () => {
  await seedChecks();
  const week = await getReport("?range=7d");
  assert.equal(week.totals.checks, 7);
  assert.equal(week.buckets.length, 28);
  assert.equal((await getReport()).range, "7d", "defaults to 7 days");
  assert.equal((await getReport("?range=30d")).buckets.length, 30);
});

test("projectId narrows the report to one API", async () => {
  const { idle } = await seedChecks();
  const report = await getReport(`?range=24h&projectId=${idle.id}`);
  assert.deepEqual(report.apis.map((a) => a.id), [idle.id]);
  assert.equal(report.totals.checks, 0);
  assert.equal(report.totals.uptimePercent, null);
  assert.deepEqual(report.incidents, []);
});

test("rejects unknown projects and ranges", async () => {
  const missing = await app.inject({ method: "GET", url: "/api/reports?projectId=999999" });
  assert.equal(missing.statusCode, 404);

  const badRange = await app.inject({ method: "GET", url: "/api/reports?range=1y" });
  assert.equal(badRange.statusCode, 400);
  assert.deepEqual(badRange.json<ErrorBody>(), { error: { message: "range must be one of: 24h, 7d, 30d" } });
});

test("the monitoring engine checks due APIs and feeds the report", async () => {
  const project = await createProject("Local API", targetUrl);
  assert.equal(project.lastCheckedAt, null);

  assert.equal(await runDueChecks(), 1);
  assert.equal(await runDueChecks(), 0, "not due again until its interval passes");

  const checked = (await app.inject({ method: "GET", url: `/api/projects/${project.id}` })).json<{ data: Project }>().data;
  assert.equal(checked.status, "healthy");
  assert.ok(checked.lastCheckedAt);

  const report = await getReport("?range=24h");
  assert.equal(report.totals.checks, 1);
  assert.equal(report.apis[0].uptimePercent, 100);
});

type ActivityBody = { data: { apiName: string; event: string; outcome: string; error: string | null }[] };
const getActivity = (query: string) => app.inject({ method: "GET", url: `/api/activity${query}` });

test("GET /api/activity lists recent checks newest first and labels status changes", async () => {
  await seedChecks();
  const res = await getActivity("?limit=3");
  assert.equal(res.statusCode, 200);
  assert.deepEqual(
    res.json<ActivityBody>().data.map((item) => [item.event, item.outcome]),
    [["Slow response", "degraded"], ["Recovered", "healthy"], ["Health check", "down"]],
  );
});

test("GET /api/activity?changes=true keeps only status changes", async () => {
  await seedChecks();
  const { data } = (await getActivity("?changes=true")).json<ActivityBody>();
  assert.deepEqual(data.map((item) => item.event), ["Slow response", "Recovered", "Went down"]);
  assert.equal(data[2].error, "Connection refused");
});

test("GET /api/activity filters by API and validates its query", async () => {
  const { idle } = await seedChecks();
  assert.deepEqual((await getActivity(`?projectId=${idle.id}`)).json<ActivityBody>().data, []);
  assert.equal((await getActivity("?projectId=999999")).statusCode, 404);

  const tooMany = await getActivity("?limit=500");
  assert.equal(tooMany.statusCode, 400);
  assert.deepEqual(tooMany.json<ErrorBody>(), { error: { message: "limit must be at most 200" } });
  assert.equal((await getActivity("?limit=abc")).statusCode, 400);
  assert.equal((await getActivity("?changes=yes")).statusCode, 400);
});

test("GET /api/health reports whether the monitoring engine is running", async () => {
  const res = await app.inject({ method: "GET", url: "/api/health" });
  assert.deepEqual(res.json<{ monitoring: unknown }>().monitoring, { running: false, lastRunAt: null });
});
