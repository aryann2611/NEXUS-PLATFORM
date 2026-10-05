import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import type { Project } from "../types/project.js";
import { alertEvent, notifyStatusChange } from "./alerts.js";
import type { CheckResult } from "./checker.js";

test("alerts when an API goes down, including on its first check", () => {
  for (const previous of ["pending", "healthy", "degraded"] as const) {
    assert.equal(alertEvent(previous, "down"), "down", previous);
  }
});

test("alerts once when it comes back, whether healthy or degraded", () => {
  assert.equal(alertEvent("down", "healthy"), "recovered");
  assert.equal(alertEvent("down", "degraded"), "recovered");
});

test("stays quiet while the status is unchanged or only flaps between healthy and degraded", () => {
  assert.equal(alertEvent("down", "down"), null);
  assert.equal(alertEvent("healthy", "healthy"), null);
  assert.equal(alertEvent("healthy", "degraded"), null);
  assert.equal(alertEvent("degraded", "healthy"), null);
  assert.equal(alertEvent("pending", "healthy"), null);
});

// --- webhook delivery -------------------------------------------------------------------------

let server: Server;
let url: string;
let received: { body: Record<string, unknown>; type: string | undefined }[] = [];
let respondWith = 200;

before(async () => {
  server = createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      received.push({ body: JSON.parse(raw), type: req.headers["content-type"] });
      res.writeHead(respondWith).end();
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/hook`;
});
after(() => {
  server.closeAllConnections();
  server.close();
});

const project = (status: Project["status"]) => ({ id: "7", name: "Orders API", baseUrl: "https://orders.example.com", status }) as Project;
const failure: CheckResult = { outcome: "down", statusCode: null, latencyMs: null, error: "timed out after 10s" };
const success: CheckResult = { outcome: "healthy", statusCode: 200, latencyMs: 120, error: null };
const at = new Date("2026-06-10T12:00:00Z");

test("posts a JSON alert when an API goes down", async () => {
  received = [];
  await notifyStatusChange(project("healthy"), failure, at, url);

  assert.equal(received.length, 1);
  assert.equal(received[0].type, "application/json");
  assert.equal(received[0].body.event, "down");
  assert.equal(received[0].body.text, "🔴 Orders API is down (timed out after 10s)");
  assert.deepEqual(received[0].body.project, { id: "7", name: "Orders API", baseUrl: "https://orders.example.com" });
  assert.equal(received[0].body.checkedAt, "2026-06-10T12:00:00.000Z");
});

test("posts a recovery alert once the API answers again", async () => {
  received = [];
  await notifyStatusChange(project("down"), success, at, url);
  assert.equal(received[0].body.event, "recovered");
  assert.equal(received[0].body.text, "🟢 Orders API is back up (120ms)");
});

test("sends nothing without a status edge or without a webhook", async () => {
  received = [];
  await notifyStatusChange(project("healthy"), success, at, url);
  await notifyStatusChange(project("down"), failure, at, url);
  await notifyStatusChange(project("healthy"), failure, at, "");
  assert.equal(received.length, 0);
});

test("a failing webhook is swallowed so the check still gets recorded", async () => {
  respondWith = 500;
  await assert.doesNotReject(notifyStatusChange(project("healthy"), failure, at, url));
  respondWith = 200;
});
