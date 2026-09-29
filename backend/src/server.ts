import { buildApp } from "./app.js";
import { env } from "./config/env.js";

const app = await buildApp({ monitoring: env.monitoring.enabled });

try {
  await app.listen({ port: env.port });
  console.log(`NEXUS API running on http://localhost:${env.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
