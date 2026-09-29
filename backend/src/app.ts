import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import { env } from "./config/env.js";
import { isDatabaseUnavailable, pool } from "./db/database.js";
import { healthRoutes } from "./routes/health.routes.js";
import { projectsRoutes } from "./routes/projects.routes.js";
import { isHttpUrl } from "./schemas/projects.schema.js";
import { describeValidationIssue } from "./schemas/validation-message.js";

export async function buildApp({ logger = true } = {}) {
  const app = Fastify({
    logger,
    ajv: {
      // Reject unknown fields and wrong types instead of Fastify's default strip/coerce behaviour.
      customOptions: { removeAdditional: false, coerceTypes: false, formats: { "http-url": isHttpUrl } },
    },
  });

  // Handlers must be set before routes are registered: plugins copy them at registration time.
  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({ error: { message: "Route not found" } });
  });

  // Client errors keep their message; server and database failures never leak internals.
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (isDatabaseUnavailable(error)) {
      request.log.error(error);
      return reply.status(503).send({ error: { message: "Database unavailable" } });
    }
    if (error.validation?.length) {
      return reply.status(400).send({ error: { message: describeValidationIssue(error.validation[0]) } });
    }
    const statusCode = error.statusCode ?? 500;
    if (statusCode >= 500) request.log.error(error);
    return reply.status(statusCode).send({
      error: { message: statusCode >= 500 ? "Internal server error" : error.message },
    });
  });

  app.addHook("onClose", () => pool.end());

  await app.register(cors, { origin: env.frontendUrl });
  await app.register(healthRoutes);
  await app.register(projectsRoutes);

  return app;
}
