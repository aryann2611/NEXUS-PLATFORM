import type { HealthState } from "../../hooks/useHealth";
import { timeAgo } from "../../lib/format";
import { backendLabel, backendTone, toneText, type Tone } from "../../lib/status";
import type { BackendStatus } from "../../types/health";
import { Badge, StatusDot } from "../common/Badge";
import Card from "../common/Card";

const headline: Record<BackendStatus, string> = {
  checking: "Checking status…",
  connected: "System Operational",
  disconnected: "Backend Unreachable",
};

const plannedServices = ["Load Test Runner"];

// The engine finishes a pass every few seconds; a minute without one means it's stuck.
const STALLED_AFTER_MS = 60_000;

function engineStatus(health: HealthState): { tone: Tone; label: string; detail?: string } {
  const monitoring = health.data?.monitoring;
  if (!monitoring) return { tone: "neutral", label: health.status === "checking" ? "Checking…" : "Unknown" };
  if (!monitoring.running) return { tone: "neutral", label: "Off", detail: "MONITORING_ENABLED=false" };
  if (!monitoring.lastRunAt) return { tone: "neutral", label: "Starting" };
  const stalled = Date.now() - Date.parse(monitoring.lastRunAt) > STALLED_AFTER_MS;
  return { tone: stalled ? "degraded" : "healthy", label: stalled ? "Stalled" : "Running", detail: `Last pass ${timeAgo(monitoring.lastRunAt)}` };
}

export default function SystemStatus({ health }: { health: HealthState }) {
  const tone = backendTone[health.status];
  const engine = engineStatus(health);
  const alerting = health.data?.alerting.webhookConfigured ?? false;

  return (
    <Card title="System Status" description="NEXUS platform services">
      <div className="border-t border-line px-5 py-4">
        <p className={`flex items-center gap-2.5 text-lg font-medium ${toneText[tone]}`}>
          <StatusDot tone={tone} pulse={health.status === "checking"} />
          {headline[health.status]}
        </p>
      </div>

      <ul className="divide-y divide-line border-t border-line">
        <li className="flex items-center justify-between gap-4 px-5 py-3">
          <div>
            <p className="text-sm text-neutral-200">NEXUS API</p>
            <p className="font-mono text-xs text-neutral-500">GET /api/health</p>
          </div>
          <div className="text-right">
            <Badge tone={tone} dot>
              {backendLabel[health.status]}
            </Badge>
            {health.latencyMs !== null && <p className="mt-1 font-mono text-xs text-neutral-500">{health.latencyMs}ms</p>}
          </div>
        </li>
        <li className="flex items-center justify-between gap-4 px-5 py-3">
          <div>
            <p className="text-sm text-neutral-200">Monitoring Engine</p>
            <p className="text-xs text-neutral-500">Checks each API on its interval</p>
          </div>
          <div className="text-right">
            <Badge tone={engine.tone} dot>
              {engine.label}
            </Badge>
            {engine.detail && <p className="mt-1 font-mono text-xs text-neutral-500">{engine.detail}</p>}
          </div>
        </li>
        {plannedServices.map((service) => (
          <li key={service} className="flex items-center justify-between gap-4 px-5 py-3">
            <p className="text-sm text-neutral-500">{service}</p>
            <Badge>Planned</Badge>
          </li>
        ))}
        <li className="flex items-center justify-between gap-4 px-5 py-3">
          <div>
            <p className={`text-sm ${alerting ? "text-neutral-200" : "text-neutral-500"}`}>Alerting</p>
            <p className="text-xs text-neutral-500">{alerting ? "Webhook on down and recovery" : "Set ALERT_WEBHOOK_URL to enable"}</p>
          </div>
          <Badge tone={alerting ? "healthy" : "neutral"} dot={alerting}>
            {alerting ? "On" : "Off"}
          </Badge>
        </li>
      </ul>
    </Card>
  );
}
