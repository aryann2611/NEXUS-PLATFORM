import mysql from "mysql2/promise";
import { env } from "../config/env.js";

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  timezone: "Z",
  connectTimeout: 5_000,
});

// TIMESTAMP values are returned in the session time zone; pin it to UTC to match `timezone: "Z"`.
pool.on("connection", (connection) => {
  void connection.query("SET time_zone = '+00:00'");
});

const unavailableCodes = new Set([
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EHOSTUNREACH",
  "PROTOCOL_CONNECTION_LOST",
  "ER_ACCESS_DENIED_ERROR",
  "ER_BAD_DB_ERROR",
  "ER_NO_SUCH_TABLE",
]);

const errorCode = (error: unknown) => (error instanceof Error && "code" in error ? String(error.code) : "");

export const isDatabaseUnavailable = (error: unknown) => unavailableCodes.has(errorCode(error));

export const isDuplicateEntry = (error: unknown) => errorCode(error) === "ER_DUP_ENTRY";
