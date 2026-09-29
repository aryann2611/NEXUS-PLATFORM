import { useSearchParams } from "react-router-dom";
import { Activity, CircleAlert, FileJson, FileSpreadsheet, Gauge, LoaderCircle, RefreshCw, ShieldAlert, Timer } from "lucide-react";
import { Badge } from "../components/common/Badge";
import { Button, ButtonLink } from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import { Select } from "../components/common/Form";
import PageHeader from "../components/common/PageHeader";
import StatCard from "../components/common/StatCard";
import ResponseTimeChart from "../components/dashboard/ResponseTimeChart";
import ApiUptimeList from "../components/reports/ApiUptimeList";
import IncidentsTable from "../components/reports/IncidentsTable";
import PerformanceTable from "../components/reports/PerformanceTable";
import UptimeTrendChart from "../components/reports/UptimeTrendChart";
import { useApis } from "../hooks/useApis";
import { useReport } from "../hooks/useReport";
import { timeAgo } from "../lib/format";
import { axisLabel, bucketLabel, downloadFile, duration, ms, percent, rangeLabel, reportToCsv } from "../lib/report";
import type { Tone } from "../lib/status";
import type { Report, ReportRange } from "../types/report";

const ranges: ReportRange[] = ["24h", "7d", "30d"];

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "performance", label: "Performance" },
  { id: "uptime", label: "Uptime" },
  { id: "incidents", label: "Incidents" },
] as const;
type Tab = (typeof tabs)[number]["id"];

const isRange = (value: string | null): value is ReportRange => ranges.includes(value as ReportRange);
const isTab = (value: string | null): value is Tab => tabs.some((tab) => tab.id === value);

function uptimeTone(value: number | null): Tone {
  if (value === null) return "neutral";
  return value >= 99.9 ? "healthy" : value >= 95 ? "degraded" : "down";
}

function exportName(report: Report, extension: string) {
  return `nexus-report-${report.range}-${report.generatedAt.slice(0, 10)}.${extension}`;
}

export default function Reports() {
  const [params, setParams] = useSearchParams();
  const range: ReportRange = isRange(params.get("range")) ? (params.get("range") as ReportRange) : "7d";
  const tab: Tab = isTab(params.get("tab")) ? (params.get("tab") as Tab) : "overview";
  const projectId = params.get("api") ?? undefined;

  const { apis } = useApis({ withMetrics: false });
  const { report, state, error, reload } = useReport(range, projectId);

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  }

  const hasData = report !== null && report.totals.checks > 0;
  const totals = report?.totals;
  const value = (text: string) => (report ? text : "—");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analyze"
        title="Reports"
        description="Uptime, latency and incidents measured by the NEXUS monitoring engine."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" disabled={!hasData} onClick={() => report && downloadFile(exportName(report, "csv"), reportToCsv(report), "text/csv")}>
              <FileSpreadsheet size={15} /> Export CSV
            </Button>
            <Button
              variant="secondary"
              disabled={!hasData}
              onClick={() => report && downloadFile(exportName(report, "json"), JSON.stringify(report, null, 2), "application/json")}
            >
              <FileJson size={15} /> Export JSON
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Report period">
          {ranges.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={range === option}
              onClick={() => update({ range: option === "7d" ? null : option })}
              className={`h-8 rounded-full border px-3 text-xs transition-colors ${
                range === option
                  ? "border-neutral-400 bg-white/[0.06] text-neutral-50"
                  : "border-line text-neutral-400 hover:border-line-strong hover:text-neutral-200"
              }`}
            >
              {rangeLabel[option]}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs text-neutral-500">
          API
          <span className="w-52">
            <Select id="report-api" value={projectId ?? ""} onChange={(e) => update({ api: e.target.value || null })}>
              <option value="">All APIs</option>
              {apis.map((api) => (
                <option key={api.id} value={api.id}>
                  {api.name}
                </option>
              ))}
            </Select>
          </span>
        </label>

        <p className="flex items-center gap-2 text-xs text-neutral-500 sm:ml-auto">
          {report && `Updated ${timeAgo(report.generatedAt, "long")}`}
          <Button variant="ghost" size="sm" onClick={reload} aria-label="Refresh report" disabled={state === "loading"}>
            <RefreshCw size={14} className={state === "loading" ? "animate-spin" : ""} />
          </Button>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Uptime"
          value={value(percent(totals?.uptimePercent ?? null))}
          hint={totals ? `${totals.failedChecks.toLocaleString("en")} failed of ${totals.checks.toLocaleString("en")} checks` : "—"}
          icon={Activity}
          tone={uptimeTone(totals?.uptimePercent ?? null)}
        />
        <StatCard label="Avg Response" value={value(ms(totals?.latency.avg ?? null))} hint={totals ? `p50 ${ms(totals.latency.p50)}` : "—"} icon={Timer} />
        <StatCard
          label="p95 Response"
          value={value(ms(totals?.latency.p95 ?? null))}
          hint={totals ? `p99 ${ms(totals.latency.p99)}` : "—"}
          icon={Gauge}
          tone={report && totals?.latency.p95 !== null && (totals?.latency.p95 ?? 0) > report.degradedAfterMs ? "degraded" : "neutral"}
        />
        <StatCard
          label="Incidents"
          value={value(String(totals?.incidents ?? 0))}
          hint={totals ? (totals.downtimeSeconds ? `${duration(totals.downtimeSeconds)} of downtime` : "No downtime") : "—"}
          icon={ShieldAlert}
          tone={totals?.incidents ? "down" : "neutral"}
        />
      </div>

      {!report ? (
        <div className="rounded-xl border border-dashed border-line">
          {state === "error" ? (
            <EmptyState icon={CircleAlert} title="Couldn't load the report" description={error}>
              <Button variant="secondary" size="sm" onClick={reload}>
                Try again
              </Button>
            </EmptyState>
          ) : (
            <EmptyState icon={LoaderCircle} title="Building report…" description="Aggregating check results for this period." />
          )}
        </div>
      ) : !hasData ? (
        <div className="rounded-xl border border-dashed border-line">
          {report.totals.apis === 0 ? (
            <EmptyState icon={Activity} title="No APIs registered yet" description="Register an API and NEXUS will start checking it right away.">
              <ButtonLink to="/apis" size="sm">
                Go to APIs
              </ButtonLink>
            </EmptyState>
          ) : (
            <EmptyState
              icon={Activity}
              title="No checks in this period yet"
              description="The monitoring engine checks each API on its interval. The first results show up here within a minute of the backend starting."
            />
          )}
        </div>
      ) : (
        <>
          <div className="flex gap-1 overflow-x-auto border-b border-line" role="tablist" aria-label="Report sections">
            {tabs.map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={tab === option.id}
                onClick={() => update({ tab: option.id === "overview" ? null : option.id })}
                className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm whitespace-nowrap transition-colors ${
                  tab === option.id ? "border-neutral-100 text-neutral-50" : "border-transparent text-neutral-500 hover:text-neutral-200"
                }`}
              >
                {option.label}
                {option.id === "incidents" && report.incidents.length > 0 && <Badge tone="down">{report.incidents.length}</Badge>}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="grid gap-4 xl:grid-cols-2">
              <Card title="Response Time" description={`p50 and p95 per ${bucketName(report)}, ${rangeLabel[range].toLowerCase()}`}>
                <ResponseTimeChart
                  data={report.buckets.map((bucket) => ({ time: bucketLabel(bucket.start, range), p50: bucket.p50, p95: bucket.p95 }))}
                  thresholdMs={report.degradedAfterMs}
                  tickFormatter={axisLabel(range)}
                />
              </Card>
              <Card title="Availability" description={`Share of successful checks per ${bucketName(report)}`}>
                <UptimeTrendChart
                  data={report.buckets.map((bucket) => ({ time: bucketLabel(bucket.start, range), uptime: bucket.uptimePercent }))}
                  tickFormatter={axisLabel(range)}
                />
              </Card>
            </div>
          )}

          {tab === "performance" && (
            <Card title="Performance by API" description={`Latency percentiles over ${rangeLabel[range].toLowerCase()}. p95 above ${report.degradedAfterMs}ms is highlighted.`}>
              <PerformanceTable apis={report.apis} degradedAfterMs={report.degradedAfterMs} />
            </Card>
          )}

          {tab === "uptime" && (
            <Card title="Uptime by API" description={`Worst result per ${bucketName(report)}. Degraded responses still count as up.`}>
              <ApiUptimeList report={report} />
            </Card>
          )}

          {tab === "incidents" && (
            <Card title="Incidents" description="Consecutive failed or slow checks, newest first.">
              {report.incidents.length ? (
                <IncidentsTable incidents={report.incidents} />
              ) : (
                <div className="border-t border-line">
                  <EmptyState icon={ShieldAlert} title="No incidents" description={`Every check passed in the ${rangeLabel[range].toLowerCase()}.`} />
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function bucketName(report: Report) {
  return report.bucketSeconds === 3_600 ? "hour" : report.bucketSeconds === 86_400 ? "day" : "6 hours";
}
