import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import { checkUrl, type CheckOptions } from "./checker.js";
import { isPrivateAddress } from "./network-guard.js";

let server: Server;
let base: string;

before(async () => {
  server = createServer((req, res) => {
    if (req.url === "/slow") return setTimeout(() => res.end("ok"), 150);
    if (req.url === "/hang") return; // never answers
    if (req.url === "/error") return res.writeHead(503).end();
    if (req.url === "/missing") return res.writeHead(404).end();
    if (req.url === "/redirect") return res.writeHead(302, { location: "http://169.254.169.254/" }).end();
    res.end("ok");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => {
  server.closeAllConnections();
  server.close();
});

const local: CheckOptions = { timeoutMs: 1_000, degradedAfterMs: 100, allowPrivateTargets: true };

test("a fast 2xx is healthy and records status and latency", async () => {
  const result = await checkUrl(`${base}/`, local);
  assert.equal(result.outcome, "healthy");
  assert.equal(result.statusCode, 200);
  assert.ok(result.latencyMs !== null && result.latencyMs < 100);
  assert.equal(result.error, null);
});

test("a 4xx still counts as up; the API answered", async () => {
  assert.equal((await checkUrl(`${base}/missing`, local)).outcome, "healthy");
});

test("redirects are not followed", async () => {
  const result = await checkUrl(`${base}/redirect`, local);
  assert.equal(result.statusCode, 302);
  assert.equal(result.outcome, "healthy");
});

test("a slow response is degraded", async () => {
  const result = await checkUrl(`${base}/slow`, local);
  assert.equal(result.outcome, "degraded");
  assert.ok(result.latencyMs !== null && result.latencyMs >= 100);
});

test("a 5xx is down", async () => {
  assert.deepEqual(
    { ...(await checkUrl(`${base}/error`, local)), latencyMs: 0 },
    { outcome: "down", statusCode: 503, latencyMs: 0, error: "HTTP 503" },
  );
});

test("no response before the timeout is down", async () => {
  const result = await checkUrl(`${base}/hang`, { ...local, timeoutMs: 200 });
  assert.equal(result.outcome, "down");
  assert.equal(result.statusCode, null);
  assert.equal(result.error, "No response after 0.2s");
});

test("a refused connection is down with a readable error", async () => {
  const result = await checkUrl("http://127.0.0.1:1/", local);
  assert.equal(result.outcome, "down");
  assert.equal(result.error, "Connection refused");
});

test("private targets are refused unless explicitly allowed", async () => {
  const guarded = { ...local, allowPrivateTargets: false };
  for (const url of [`${base}/`, "http://169.254.169.254/latest/meta-data", "http://[::1]/", "http://localhost:1/"]) {
    const result = await checkUrl(url, guarded);
    assert.equal(result.outcome, "down", url);
    assert.match(result.error ?? "", /private or internal address/, url);
  }
});

test("isPrivateAddress covers internal ranges but not public ones", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "172.20.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1"]) {
    assert.equal(isPrivateAddress(ip), true, ip);
  }
  for (const ip of ["8.8.8.8", "140.82.112.5", "2606:4700::1111", "::ffff:8.8.8.8", "not-an-ip"]) {
    assert.equal(isPrivateAddress(ip), false, ip);
  }
});
