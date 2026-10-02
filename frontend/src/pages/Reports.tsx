import { Activity, ChartLine, FileText, Gauge, Zap } from "lucide-react";
import { Badge } from "../components/common/Badge";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHeader";
import ApiMetricsTable from "../components/reports/ApiMetricsTable";
import LoadTestRunsTable from "../components/reports/LoadTestRunsTable";
import { useApis } from "../hooks/useApis";
import { getLoadTestHistory } from "../lib/loadTestHistory";

export default function Reports() {
  const runs = getLoadTestHistory();
  const { apis } = useApis();
  const measuredApis = apis.filter((api) => api.uptimePercent !== null);

  const reportTypes = [
    {
      icon: Zap,
      title: "Load Tests",
      description: "Results and comparisons across load-test runs.",
      badge: runs.length > 0 ? { label: `${runs.length} run${runs.length === 1 ? "" : "s"}`, tone: "healthy" as const } : { label: "No runs yet" },
    },
    {
      icon: Gauge,
      title: "Performance",
      description: "Average latency per API from health checks.",
      badge: measuredApis.length > 0 ? { label: `${measuredApis.length} API${measuredApis.length === 1 ? "" : "s"}`, tone: "healthy" as const } : { label: "Awaiting checks" },
    },
    {
      icon: Activity,
      title: "Uptime",
      description: "Availability over the last 30 days per API.",
      badge: measuredApis.length > 0 ? { label: `${measuredApis.length} API${measuredApis.length === 1 ? "" : "s"}`, tone: "healthy" as const } : { label: "Awaiting checks" },
    },
    { icon: ChartLine, title: "Historical Analytics", description: "Long-term trends and regressions over time.", badge: { label: "Planned" } },
  ];

  return (
    <div className="stagger space-y-6">
      <PageHeader eyebrow="Analyze" title="Reports" description="Performance, uptime and load-test reports for your APIs." />

      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {reportTypes.map(({ icon: Icon, title, description, badge }) => (
          <div key={title} className="surface-card group p-5 transition duration-300 hover:-translate-y-1 hover:border-line-strong">
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-10 place-items-center rounded-xl border border-line bg-surface-3 text-neutral-300 transition-transform duration-300 group-hover:scale-110">
                <Icon size={17} />
              </span>
              <Badge tone={badge.tone} dot={!!badge.tone}>
                {badge.label}
              </Badge>
            </div>
            <h2 className="mt-5 font-semibold text-neutral-100">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-neutral-400">{description}</p>
          </div>
        ))}
      </div>

      <Card title="API Performance & Uptime" description="Health-check results per registered API, last 30 days.">
        {apis.length > 0 ? (
          <ApiMetricsTable apis={apis} />
        ) : (
          <div className="border-t border-line">
            <EmptyState icon={Activity} title="No APIs registered" description="Register an API from the APIs page to start collecting health-check metrics." />
          </div>
        )}
      </Card>

      <Card title="Load Test Reports" description="Every completed k6 run, stored locally in this browser.">
        {runs.length > 0 ? (
          <LoadTestRunsTable runs={runs} />
        ) : (
          <div className="border-t border-line">
            <EmptyState icon={FileText} title="No reports yet" description="Run a load test from the Load Tests page — it'll show up here as a report." />
          </div>
        )}
      </Card>
    </div>
  );
}
