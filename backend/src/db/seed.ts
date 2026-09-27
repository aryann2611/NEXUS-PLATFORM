import { HttpError } from "../errors.js";
import { createProject } from "../services/projects.service.js";
import { pool } from "./database.js";

// Real, key-free public APIs for demos. They stay "pending" until the monitoring engine checks them.
const publicApis = [
  { name: "GitHub REST API", baseUrl: "https://api.github.com", description: "GitHub's public REST API.", tags: ["devtools", "rest"] },
  { name: "JSONPlaceholder", baseUrl: "https://jsonplaceholder.typicode.com", description: "Free fake REST API for testing and prototyping.", tags: ["testing", "rest"] },
  { name: "Open-Meteo", baseUrl: "https://api.open-meteo.com", description: "Open-source weather forecast API.", tags: ["weather", "rest"] },
  { name: "PokéAPI", baseUrl: "https://pokeapi.co/api/v2", description: "RESTful Pokémon data API.", tags: ["games", "rest"] },
];

try {
  for (const api of publicApis) {
    try {
      await createProject({ ...api, checkInterval: 60, timeout: 10 });
      console.log(`Added ${api.name}`);
    } catch (error) {
      if (!(error instanceof HttpError && error.statusCode === 409)) throw error;
      console.log(`Skipped ${api.name} (already registered)`);
    }
  }
} catch (error) {
  console.error("Seeding failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
