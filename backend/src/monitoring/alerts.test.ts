import assert from "node:assert/strict";
import { test } from "node:test";
import { alertEvent } from "./alerts.js";

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
