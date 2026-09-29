import type { Report, ReportRange } from "../types/report";

export const rangeLabel: Record<ReportRange, string> = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};

export const ms = (value: number | null) => (value === null ? "—" : `${value.toLocaleString("en")}ms`);
export const percent = (value: number | null) => (value === null ? "—" : `${value}%`);

/** 3725 → "1h 2m"; under a minute → "45s". */
export function duration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  return [days && `${days}d`, hours && `${hours}h`, minutes && `${minutes}m`].filter(Boolean).slice(0, 2).join(" ");
}

const hourFormat = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const dayFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });
const dayHourFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", hourCycle: "h23" });
const dateTimeFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

/** Axis label for a bucket start, in the viewer's time zone. */
export function bucketLabel(iso: string, range: ReportRange): string {
  const date = new Date(iso);
  if (range === "24h") return hourFormat.format(date);
  if (range === "30d") return dayFormat.format(date);
  return `${dayHourFormat.format(date)}h`;
}

/** Axis tick: the date alone for the 7-day view, whose buckets are 6 hours wide. */
export const axisLabel = (range: ReportRange) => (range === "7d" ? (label: string) => label.split(",")[0] : undefined);

export const dateTime = (iso: string) => dateTimeFormat.format(new Date(iso));

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const csvRows = (rows: unknown[][]) => rows.map((row) => row.map(csvCell).join(",")).join("\n");

/** Per-API summary followed by the incident log, as one CSV document. */
export function reportToCsv(report: Report): string {
  const apis = csvRows([
    ["API", "Base URL", "Status", "Checks", "Failed checks", "Uptime %", "Avg ms", "p50 ms", "p95 ms", "p99 ms", "Min ms", "Max ms", "Incidents", "Downtime s"],
    ...report.apis.map((api) => [
      api.name, api.baseUrl, api.status, api.checks, api.failedChecks, api.uptimePercent,
      api.latency.avg, api.latency.p50, api.latency.p95, api.latency.p99, api.latency.min, api.latency.max,
      api.incidents, api.downtimeSeconds,
    ]),
  ]);
  const incidents = csvRows([
    ["API", "Severity", "Started", "Resolved", "Duration s", "Checks", "Last error"],
    ...report.incidents.map((incident) => [
      incident.apiName, incident.severity, incident.startedAt, incident.resolvedAt ?? "ongoing",
      incident.durationSeconds, incident.checks, incident.lastError,
    ]),
  ]);
  return `NEXUS report,${rangeLabel[report.range]},${report.from},${report.to}\n\n${apis}\n\nIncidents\n${incidents}\n`;
}

export function downloadFile(filename: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = Object.assign(document.createElement("a"), { href: url, download: filename });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
