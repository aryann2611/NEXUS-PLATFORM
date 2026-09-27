import { readdir, readFile } from "node:fs/promises";
import mysql, { type RowDataPacket } from "mysql2/promise";
import { env } from "../config/env.js";

const migrationsDir = new URL("./migrations/", import.meta.url);

/** Creates the database if needed and applies pending .sql files in filename order. */
export async function runMigrations(log: (message: string) => void = console.log) {
  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
  });

  try {
    const database = mysql.escapeId(env.db.name);
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${database} CHARACTER SET utf8mb4`);
    await connection.query(`USE ${database}`);
    await connection.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(255) PRIMARY KEY, applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)",
    );

    const [rows] = await connection.query<RowDataPacket[]>("SELECT name FROM schema_migrations");
    const applied = new Set(rows.map((row) => String(row.name)));
    const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

    for (const file of files) {
      if (applied.has(file)) continue;
      await connection.query(await readFile(new URL(file, migrationsDir), "utf8"));
      await connection.query("INSERT INTO schema_migrations (name) VALUES (?)", [file]);
      log(`Applied ${file}`);
    }
    log(`Database ${env.db.name} is up to date`);
  } finally {
    await connection.end();
  }
}
