import { env } from "../config/env.js";
import type { CheckOutcome } from "../types/check.js";
import type { Project, ProjectStatus } from "../types/project.js";
import type { CheckResult } from "./checker.js";

export type AlertEvent = "down" | "recovered";

/**
 * Which alert, if any, a check result triggers. Only the edges alert: going down (including a
 * first check that fails) and coming back up. Healthy <-> degraded flips are too noisy to page on.
 */
export function alertEvent(previous: ProjectStatus, outcome: CheckOutcome): AlertEvent | null {
  if (outcome === "down") return previous === "down" ? null : "down";
  return previous === "down" ? "recovered" : null;
}

export interface AlertPayload {
  /** Human-readable summary; Slack, Mattermost and similar incoming webhooks display this field. */
  text: string;
  event: AlertEvent;
  project: { id: string; name: string; baseUrl: string };
  outcome: CheckOutcome;
  statusCode: number | null;
  latencyMs: number | null;
  error: string | null;
  checkedAt: string;
}

export function buildAlert(event: AlertEvent, project: Project, result: CheckResult, checkedAt: Date): AlertPayload {
  const detail = event === "down" ? (result.error ?? `HTTP ${result.statusCode}`) : `${result.latencyMs}ms`;
  return {
    text: `${event === "down" ? "🔴" : "🟢"} ${project.name} is ${event === "down" ? "down" : "back up"} (${detail})`,
    event,
    project: { id: project.id, name: project.name, baseUrl: project.baseUrl },
    outcome: result.outcome,
    statusCode: result.statusCode,
    latencyMs: result.latencyMs,
    error: result.error,
    checkedAt: checkedAt.toISOString(),
  };
}

export async function postAlert(url: string, payload: AlertPayload, timeoutMs = 5_000): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Alert webhook answered ${res.status}`);
}

/**
 * Sends an alert if `result` is a down/recovered edge and a webhook is configured. A broken
 * webhook is logged and swallowed: it must never stop the check from being recorded.
 */
export async function notifyStatusChange(project: Project, result: CheckResult, checkedAt: Date, url = env.alerts.webhookUrl): Promise<void> {
  const event = alertEvent(project.status, result.outcome);
  if (!event || !url) return;
  try {
    await postAlert(url, buildAlert(event, project, result, checkedAt));
  } catch (error) {
    console.error(`Alert for "${project.name}" failed:`, error);
  }
}
