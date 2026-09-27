import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import { env } from "./config/env.js";
import { healthRoutes } from "./routes/health.routes.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: env.frontendUrl });
await app.register(healthRoutes);

app.setErrorHandler((error: FastifyError, _request, reply) => {
  app.log.error(error);
  reply.status(error.statusCode ?? 500).send({
    status: "error",
    message: error.message || "Internal server error",
  });
});

try {
  await app.listen({ port: env.port });
  console.log(`NEXUS API running on http://localhost:${env.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
