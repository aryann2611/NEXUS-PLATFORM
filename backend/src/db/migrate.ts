import { runMigrations } from "./migrator.js";

try {
  await runMigrations();
} catch (error) {
  console.error("Migration failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
