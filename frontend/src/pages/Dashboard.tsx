import { useOutletContext } from "react-router-dom";
import { ArrowUpDown, ShieldCheck, Timer, TriangleAlert } from "lucide-react";
import { Badge } from "../components/common/Badge";
import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";
import StatCard from "../components/common/StatCard";
import ApiStatusTable from "../components/dashboard/ApiStatusTable";
import ResponseTimeChart from "../components/dashboard/ResponseTimeChart";
import SystemStatus from "../components/dashboard/SystemStatus";
import type { LayoutContext } from "../components/layout/AppLayout";
import { useApis } from "../hooks/useApis";
import { useOverview } from "../hooks/useOverview";
import { compactNumber } from "../lib/format";

const orDash = (value: number | null | undefined, format: (n: number) => string) => (value == null ? "—" : format(value));
// Sparkline needs at least two points to draw a line.
const trendOf = (values?: number[]) => (values && values.length >= 2 ? values : undefined);

export default function Dashboard() {
  const { health } = useOutletContext<LayoutContext>();
  const { overview, failed } = useOverview();
  const { apis } = useApis();
  const summary = overview?.summary;

  return (
    <div className="stagger space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Health and performance across your APIs."
        actions={failed ? <Badge tone="down">Couldn't load metrics</Badge> : undefined}
      />

      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Uptime"
          value={orDash(summary?.uptimePercent, (n) => `${n}%`)}
          hint="Last 30 days"
          icon={ShieldCheck}
          tone={summary?.uptimePercent == null ? "neutral" : summary.uptimePercent >= 99.9 ? "healthy" : "degraded"}
          trend={trendOf(summary?.trends.uptime)}
        />
        <StatCard label="Checks" value={orDash(summary?.checks24h, compactNumber)} hint="Last 24 hours" icon={ArrowUpDown} trend={trendOf(summary?.trends.checks)} />
        <StatCard label="Avg Latency" value={orDash(summary?.avgLatencyMs, (n) => `${n}ms`)} hint="Last 24 hours" icon={Timer} trend={trendOf(summary?.trends.latency)} />
        <StatCard label="Error Rate" value={orDash(summary?.errorRatePercent, (n) => `${n}%`)} hint="Failed checks, last 24 hours" icon={TriangleAlert} trend={trendOf(summary?.trends.errorRate)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Response Time" description="p50 and p95 latency per hour over the last 24 hours" className="xl:col-span-2">
          <ResponseTimeChart data={overview?.latencySeries ?? []} thresholdMs={overview?.latencyThresholdMs ?? 1000} />
        </Card>
        <SystemStatus health={health} />
      </div>

      <Card title="APIs" description="Latest health-check state per API">
        <ApiStatusTable apis={apis} />
      </Card>
    </div>
  );
}
