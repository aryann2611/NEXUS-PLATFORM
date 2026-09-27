import { Readable } from "node:stream";
import type { FastifyInstance } from "fastify";
import { HttpError } from "../errors.js";
import { startLoadTestSchema } from "../schemas/loadTests.schema.js";
import { ensureK6, runLoadTest } from "../services/loadTest.service.js";
import type { LoadTestInput } from "../types/loadTest.js";

export async function loadTestsRoutes(app: FastifyInstance) {
  // Streams newline-delimited JSON snapshots while k6 runs; the client reads them live.
  app.post<{ Body: LoadTestInput }>("/api/load-tests", { schema: startLoadTestSchema }, async (request, reply) => {
    if (!(await ensureK6())) throw new HttpError(503, "k6 is not installed on the server");

    reply.header("content-type", "application/x-ndjson");
    reply.header("cache-control", "no-store");

    async function* lines() {
      for await (const snapshot of runLoadTest(request.body)) {
        yield `${JSON.stringify(snapshot)}\n`;
      }
    }
    return Readable.from(lines());
  });
}
