import { dateTime, duration } from "../../lib/report";
import { Badge } from "../common/Badge";
import type { Incident } from "../../types/report";

const th = "px-5 py-2.5 font-medium";
const td = "px-5 py-3 whitespace-nowrap";

export default function IncidentsTable({ incidents }: { incidents: Incident[] }) {
  return (
    <div className="overflow-x-auto border-t border-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-neutral-500">
            <th className={th}>API</th>
            <th className={th}>Severity</th>
            <th className={th}>Started</th>
            <th className={`${th} text-right`}>Duration</th>
            <th className={th}>State</th>
            <th className={`${th} hidden md:table-cell`}>Last error</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {incidents.map((incident) => (
            <tr key={`${incident.apiId}-${incident.startedAt}`} className="transition-colors hover:bg-white/[0.02]">
              <td className={`${td} text-neutral-200`}>{incident.apiName}</td>
              <td className={td}>
                <Badge tone={incident.severity} dot>
                  {incident.severity === "down" ? "Down" : "Degraded"}
                </Badge>
              </td>
              <td className={`${td} text-neutral-400`}>{dateTime(incident.startedAt)}</td>
              <td className={`${td} text-right font-mono tabular-nums text-neutral-200`}>{duration(incident.durationSeconds)}</td>
              <td className={td}>
                {incident.resolvedAt ? (
                  <span className="text-neutral-500">Resolved {dateTime(incident.resolvedAt)}</span>
                ) : (
                  <Badge tone={incident.severity} dot>
                    Ongoing
                  </Badge>
                )}
              </td>
              <td className={`${td} hidden max-w-72 truncate font-mono text-xs text-neutral-500 md:table-cell`} title={incident.lastError ?? ""}>
                {incident.lastError ?? (incident.severity === "degraded" ? "Slow responses" : "—")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
