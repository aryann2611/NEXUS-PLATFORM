import { useOutletContext } from "react-router-dom";
import { ArrowUpDown, ShieldCheck, Timer, TriangleAlert } from "lucide-react";
import { Badge } from "../components/common/Badge";
import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";
import StatCard from "../components/common/StatCard";
import EndpointTable from "../components/dashboard/EndpointTable";
import ResponseTimeChart from "../components/dashboard/ResponseTimeChart";
import SystemStatus from "../components/dashboard/SystemStatus";
import type { LayoutContext } from "../components/layout/AppLayout";
import { compactNumber } from "../lib/format";
import { dashboardSummary as summary, endpoints, latencySeries, latencyThresholdMs } from "../mock/dashboard";

export default function Dashboard() {
  const { health } = useOutletContext<LayoutContext>();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Overview" title="Dashboard" description="Health and performance across your APIs." actions={<Badge>Sample data</Badge>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Uptime"
          value={`${summary.uptimePercent}%`}
          hint="Last 30 days"
          icon={ShieldCheck}
          tone={summary.uptimePercent >= 99.9 ? "healthy" : "degraded"}
          trend={summary.trends.uptime}
        />
        <StatCard label="Requests" value={compactNumber(summary.requests24h)} hint="Last 24 hours" icon={ArrowUpDown} trend={summary.trends.requests} />
        <StatCard label="Avg Latency" value={`${summary.avgLatencyMs}ms`} hint="Last 24 hours" icon={Timer} trend={summary.trends.latency} />
        <StatCard label="Error Rate" value={`${summary.errorRatePercent}%`} hint="Last 24 hours" icon={TriangleAlert} trend={summary.trends.errorRate} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Response Time" description="p50 and p95 latency over the last 24 hours" className="xl:col-span-2">
          <ResponseTimeChart data={latencySeries} thresholdMs={latencyThresholdMs} />
        </Card>
        <SystemStatus health={health} />
      </div>

      <Card title="Endpoints" description="Latest check per endpoint">
        <EndpointTable endpoints={endpoints} />
      </Card>
    </div>
  );
}
