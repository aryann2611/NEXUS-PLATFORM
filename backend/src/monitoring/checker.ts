import http from "node:http";
import https from "node:https";
import { isIP } from "node:net";
import type { CheckOutcome } from "../types/check.js";
import { BlockedTargetError, guardedLookup, isPrivateAddress } from "./network-guard.js";

export interface CheckOptions {
  timeoutMs: number;
  degradedAfterMs: number;
  allowPrivateTargets: boolean;
}

export interface CheckResult {
  outcome: CheckOutcome;
  statusCode: number | null;
  latencyMs: number | null;
  error: string | null;
}

/**
 * One GET against the URL. Latency is time to response headers. Redirects are not followed, so a
 * 3xx counts as a response (and can't bounce the checker to an internal address).
 * - down: no response, timeout, blocked target, or a 5xx
 * - degraded: responded, but slower than `degradedAfterMs`
 * - healthy: anything else
 */
export function checkUrl(target: string, options: CheckOptions): Promise<CheckResult> {
  const url = new URL(target);
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (!options.allowPrivateTargets && isIP(hostname) && isPrivateAddress(hostname)) {
    return Promise.resolve(down(`${hostname} is a private or internal address`));
  }

  return new Promise((resolve) => {
    const started = performance.now();
    const client = url.protocol === "https:" ? https : http;
    const request = client.request(
      url,
      {
        method: "GET",
        headers: { "user-agent": "NEXUS-Monitor/1.0", accept: "*/*" },
        lookup: options.allowPrivateTargets ? undefined : guardedLookup,
      },
      (response) => {
        clearTimeout(deadline);
        const latencyMs = Math.round(performance.now() - started);
        response.resume();
        request.destroy();
        const statusCode = response.statusCode ?? 0;
        if (statusCode >= 500) return resolve({ outcome: "down", statusCode, latencyMs, error: `HTTP ${statusCode}` });
        const outcome = latencyMs > options.degradedAfterMs ? "degraded" : "healthy";
        resolve({ outcome, statusCode, latencyMs, error: null });
      },
    );
    // A hard deadline, unlike the socket's idle `timeout`, which a server trickling bytes could keep extending.
    const deadline = setTimeout(() => {
      request.destroy(new Error(`No response after ${options.timeoutMs / 1000}s`));
    }, options.timeoutMs);
    request.on("error", (error: NodeJS.ErrnoException) => {
      clearTimeout(deadline);
      resolve(down(describeError(error)));
    });
    request.end();
  });
}

const down = (error: string): CheckResult => ({ outcome: "down", statusCode: null, latencyMs: null, error });

function describeError(error: NodeJS.ErrnoException): string {
  if (error instanceof BlockedTargetError) return error.message;
  const messages: Record<string, string> = {
    ENOTFOUND: "Host not found",
    ECONNREFUSED: "Connection refused",
    ECONNRESET: "Connection reset",
    EHOSTUNREACH: "Host unreachable",
    ETIMEDOUT: "Connection timed out",
    CERT_HAS_EXPIRED: "TLS certificate has expired",
    DEPTH_ZERO_SELF_SIGNED_CERT: "Self-signed TLS certificate",
    ERR_TLS_CERT_ALTNAME_INVALID: "TLS certificate doesn't match the host",
  };
  return (error.code && messages[error.code]) || error.message.slice(0, 255);
}
