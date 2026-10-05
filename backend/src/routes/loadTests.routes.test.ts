import assert from "node:assert/strict";
import { after, test } from "node:test";
import { buildApp } from "../app.js";

// Validation runs before the k6 check, so none of these requests spawn k6 or touch the database.
const app = await buildApp({ logger: false });
after(() => app.close());

const start = (payload: object) => app.inject({ method: "POST", url: "/api/load-tests", payload });
const message = (res: { json: <T>() => T }) => res.json<{ error: { message: string } }>().error.message;

test("rejects a missing target URL", async () => {
  const res = await start({ vus: 5 });
  assert.equal(res.statusCode, 400);
  assert.match(message(res), /url/);
});

test("rejects a target that isn't http(s)", async () => {
  for (const url of ["ftp://example.com", "not a url", "file:///etc/passwd"]) {
    const res = await start({ url });
    assert.equal(res.statusCode, 400, url);
  }
});

test("enforces the virtual-user and duration caps", async () => {
  for (const override of [{ vus: 0 }, { vus: 51 }, { durationSeconds: 4 }, { durationSeconds: 61 }, { vus: "10" }]) {
    const res = await start({ url: "https://example.com", ...override });
    assert.equal(res.statusCode, 400, JSON.stringify(override));
  }
});

test("rejects fields outside the contract", async () => {
  const res = await start({ url: "https://example.com", rate: 10_000 });
  assert.equal(res.statusCode, 400);
});
