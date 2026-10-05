import { useOutletContext } from "react-router-dom";
import { Activity, CircleAlert, LoaderCircle, ShieldCheck, Timer, TriangleAlert } from "lucide-react";
import { ButtonLink } from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHeader";
import StatCard from "../components/common/StatCard";
import ApiStatusTable from "../components/dashboard/ApiStatusTable";
import ResponseTimeChart from "../components/dashboard/ResponseTimeChart";
import SystemStatus from "../components/dashboard/SystemStatus";
import type { LayoutContext } from "../components/layout/AppLayout";
import { useReport } from "../hooks/useReport";
import { compactNumber } from "../lib/format";
import { bucketLabel, ms, percent } from "../lib/report";
import type { Tone } from "../lib/status";

// Sparklines skip buckets with no checks rather than drawing them as zero.
const series = (values: (number | null)[]) => {
  const known = values.filter((value): value is number => value !== null);
  return known.length > 1 ? known : undefined;
};

export default function Dashboard() {
  const { health } = useOutletContext<LayoutContext>();
  const { report, state, error, reload } = useReport("24h");
  const totals = report?.totals;
  const hasData = !!totals && totals.checks > 0;

  const errorRate = totals && totals.checks ? Math.round((totals.failedChecks / totals.checks) * 10_000) / 100 : null;
  const uptimeTone: Tone = !hasData || totals.uptimePercent === null ? "neutral" : totals.uptimePercent >= 99.9 ? "healthy" : totals.uptimePercent >= 95 ? "degraded" : "down";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Health and performance across your APIs over the last 24 hours."
        actions={
          <ButtonLink to="/reports" size="sm">
            Full report
          </ButtonLink>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Uptime"
          value={hasData ? percent(totals.uptimePercent) : "—"}
          hint="Last 24 hours"
          icon={ShieldCheck}
          tone={uptimeTone}
          trend={series(report?.buckets.map((b) => b.uptimePercent) ?? [])}
        />
        <StatCard
          label="Checks"
          value={hasData ? compactNumber(totals.checks) : "—"}
          hint={totals ? `Across ${totals.apis} API${totals.apis === 1 ? "" : "s"}` : "Last 24 hours"}
          icon={Activity}
          trend={series(report?.buckets.map((b) => (b.checks ? b.checks : null)) ?? [])}
        />
        <StatCard
          label="Avg Latency"
          value={hasData ? ms(totals.latency.avg) : "—"}
          hint={hasData ? `p95 ${ms(totals.latency.p95)}` : "Last 24 hours"}
          icon={Timer}
          trend={series(report?.buckets.map((b) => b.p50) ?? [])}
        />
        <StatCard
          label="Error Rate"
          value={hasData ? `${errorRate}%` : "—"}
          hint={hasData ? `${totals.failedChecks} failed checks` : "Last 24 hours"}
          icon={TriangleAlert}
          tone={errorRate ? "down" : "neutral"}
          trend={series(report?.buckets.map((b) => (b.uptimePercent === null ? null : Math.round((100 - b.uptimePercent) * 100) / 100)) ?? [])}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Response Time" description="p50 and p95 latency per hour, last 24 hours" className="xl:col-span-2">
          {hasData ? (
            <ResponseTimeChart
              data={report.buckets.map((b) => ({ time: bucketLabel(b.start, "24h"), p50: b.p50, p95: b.p95 }))}
              thresholdMs={report.degradedAfterMs}
            />
          ) : (
            <div className="border-t border-line">
              <EmptyState icon={Timer} title="No measurements yet" description="Response times appear once the monitoring engine has checked your APIs." />
            </div>
          )}
        </Card>
        <SystemStatus health={health} />
      </div>

      <Card title="APIs" description="Current status and figures for the last 24 hours, problems first">
        {report && report.apis.length > 0 ? (
          <ApiStatusTable apis={report.apis} />
        ) : (
          <div className="border-t border-line">
            {state === "error" ? (
              <EmptyState icon={CircleAlert} title="Couldn't load your APIs" description={error} />
            ) : state === "loading" && !report ? (
              <EmptyState icon={LoaderCircle} title="Loading…" description="Fetching the latest figures." />
            ) : (
              <EmptyState icon={Activity} title="No APIs registered yet" description="Register an API and NEXUS will start checking it right away.">
                <ButtonLink to="/apis" size="sm">
                  Go to APIs
                </ButtonLink>
              </EmptyState>
            )}
          </div>
        )}
        {state === "error" && report && (
          <p className="border-t border-line px-5 py-3 text-xs text-red-400">
            Showing the last loaded figures. {error}{" "}
            <button type="button" onClick={reload} className="underline">
              Retry
            </button>
          </p>
        )}
      </Card>
    </div>
  );
}
