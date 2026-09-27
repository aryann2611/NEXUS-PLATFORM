import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import type { Project } from "../types/project.js";

// Integration tests against a real MySQL database; set before env.ts loads.
process.env.DB_NAME = "nexus_test";

const { buildApp } = await import("../app.js");
const { pool } = await import("../db/database.js");
const { runMigrations } = await import("../db/migrator.js");

const app = await buildApp({ logger: false });

const validBody = {
  name: "My E-Commerce API",
  baseUrl: "https://api.example.com",
  description: "E-commerce backend",
  tags: ["ecommerce", "production"],
  checkInterval: 60,
  timeout: 10,
};

type ErrorBody = { error: { message: string } };

const createProject = (payload: object) => app.inject({ method: "POST", url: "/api/projects", payload });

before(() => runMigrations(() => {}));
beforeEach(() => pool.query("DELETE FROM projects"));
after(() => app.close());

test("POST /api/projects stores a pending project", async () => {
  const res = await createProject(validBody);
  assert.equal(res.statusCode, 201);

  const { data } = res.json<{ data: Project }>();
  assert.match(data.id, /^\d+$/);
  assert.equal(data.status, "pending");
  assert.equal(data.name, validBody.name);
  assert.equal(data.baseUrl, validBody.baseUrl);
  assert.equal(data.description, validBody.description);
  assert.deepEqual(data.tags, validBody.tags);
  assert.equal(data.checkInterval, 60);
  assert.equal(data.timeout, 10);
  assert.ok(Math.abs(Date.parse(data.createdAt) - Date.now()) < 60_000, "createdAt is a current UTC timestamp");
});

test("POST /api/projects applies defaults for optional fields", async () => {
  const res = await createProject({ name: "Minimal API", baseUrl: "http://localhost:4000" });
  assert.equal(res.statusCode, 201);

  const { data } = res.json<{ data: Project }>();
  assert.equal(data.description, null);
  assert.deepEqual(data.tags, []);
  assert.equal(data.checkInterval, 60);
  assert.equal(data.timeout, 10);
});

test("GET /api/projects returns all projects", async () => {
  await createProject(validBody);
  await createProject({ ...validBody, name: "Payments API" });

  const res = await app.inject({ method: "GET", url: "/api/projects" });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(
    res.json<{ data: Project[] }>().data.map((project) => project.name),
    ["Payments API", validBody.name],
  );
});

test("GET /api/projects/:id returns a single project", async () => {
  const created = (await createProject(validBody)).json<{ data: Project }>().data;

  const res = await app.inject({ method: "GET", url: `/api/projects/${created.id}` });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json<{ data: Project }>().data, created);
});

test("GET /api/projects/:id returns 404 for an unknown project", async () => {
  const res = await app.inject({ method: "GET", url: "/api/projects/999999" });
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.json<ErrorBody>(), { error: { message: "Project not found" } });
});

test("rejects a base URL that isn't http(s)", async () => {
  for (const baseUrl of ["ftp://files.example.com", "not a url", "https://", "javascript:alert(1)"]) {
    const res = await createProject({ ...validBody, baseUrl });
    assert.equal(res.statusCode, 400, baseUrl);
    assert.match(res.json<ErrorBody>().error.message, /baseUrl/);
  }
});

test("rejects a missing name", async () => {
  const { name: _name, ...body } = validBody;
  const res = await createProject(body);
  assert.equal(res.statusCode, 400);
  assert.match(res.json<ErrorBody>().error.message, /name/);
});

test("rejects a missing base URL", async () => {
  const { baseUrl: _baseUrl, ...body } = validBody;
  const res = await createProject(body);
  assert.equal(res.statusCode, 400);
  assert.match(res.json<ErrorBody>().error.message, /baseUrl/);
});

test("rejects out-of-range check interval and timeout", async () => {
  for (const override of [{ checkInterval: 5 }, { checkInterval: "60" }, { timeout: 0 }, { timeout: 120 }]) {
    const res = await createProject({ ...validBody, ...override });
    assert.equal(res.statusCode, 400, JSON.stringify(override));
  }
});

test("rejects fields that aren't part of the contract", async () => {
  const res = await createProject({ ...validBody, status: "healthy" });
  assert.equal(res.statusCode, 400);

  const list = await app.inject({ method: "GET", url: "/api/projects" });
  assert.equal(list.json<{ data: Project[] }>().data.length, 0);
});

test("rejects a duplicate name with 409", async () => {
  await createProject(validBody);
  const res = await createProject({ ...validBody, baseUrl: "https://other.example.com" });
  assert.equal(res.statusCode, 409);
  assert.match(res.json<ErrorBody>().error.message, /already registered/);
});
