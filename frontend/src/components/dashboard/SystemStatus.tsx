import type { HealthState } from "../../hooks/useHealth";
import { backendLabel, backendTone, toneText } from "../../lib/status";
import type { BackendStatus } from "../../types/health";
import { Badge, StatusDot } from "../common/Badge";
import Card from "../common/Card";

const headline: Record<BackendStatus, string> = {
  checking: "Checking status…",
  connected: "System Operational",
  disconnected: "Backend Unreachable",
};

const liveServices = ["Load Test Runner", "Monitoring Engine"];

export default function SystemStatus({ health }: { health: HealthState }) {
  const tone = backendTone[health.status];

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
        {liveServices.map((service) => (
          <li key={service} className="flex items-center justify-between gap-4 px-5 py-3">
            <p className="text-sm text-neutral-200">{service}</p>
            <Badge tone="healthy" dot>
              Live
            </Badge>
          </li>
        ))}
        <li className="flex items-center justify-between gap-4 px-5 py-3">
          <p className="text-sm text-neutral-500">Alerting</p>
          <Badge>Planned</Badge>
        </li>
      </ul>
    </Card>
  );
}
