import type { ReactNode } from "react";
import { useOutletContext } from "react-router-dom";
import { Settings2 } from "lucide-react";
import { Badge } from "../components/common/Badge";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHeader";
import type { LayoutContext } from "../components/layout/AppLayout";
import { backendLabel, backendTone } from "../lib/status";
import { API_URL } from "../services/api";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5">
      <dt className="text-sm text-neutral-400">{label}</dt>
      <dd className="text-sm text-neutral-200">{children}</dd>
    </div>
  );
}

export default function Settings() {
  const { health } = useOutletContext<LayoutContext>();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Workspace" title="Settings" description="Connection details for this NEXUS instance." />

      <Card title="Backend Connection" description="Where the dashboard sends its API requests.">
        <dl className="divide-y divide-line border-t border-line">
          <Row label="API URL">
            <span className="font-mono">{API_URL}</span>
          </Row>
          <Row label="Health endpoint">
            <span className="font-mono">GET /api/health</span>
          </Row>
          <Row label="Status">
            <Badge tone={backendTone[health.status]} dot>
              {backendLabel[health.status]}
            </Badge>
          </Row>
          <Row label="Response time">
            <span className="font-mono">{health.latencyMs === null ? "—" : `${health.latencyMs}ms`}</span>
          </Row>
          <Row label="Server time">
            <span className="font-mono">{health.data?.timestamp ?? "—"}</span>
          </Row>
        </dl>
      </Card>

      <Card title="Workspace">
        <div className="border-t border-line">
          <EmptyState icon={Settings2} title="More settings are on the way" description="Team members, notifications and API keys arrive together with authentication." />
        </div>
      </Card>
    </div>
  );
}
