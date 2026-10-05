import { ms, percent } from "../../lib/report";
import type { ApiReport } from "../../types/report";
import { StatusBadge } from "../common/Badge";

const th = "px-5 py-2.5 font-medium";
const td = "px-5 py-3 whitespace-nowrap";

/** Latency percentiles per API; p95 above the degraded threshold is flagged. */
export default function PerformanceTable({ apis, degradedAfterMs }: { apis: ApiReport[]; degradedAfterMs: number }) {
  return (
    <div className="overflow-x-auto border-t border-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-neutral-500">
            <th className={th}>API</th>
            <th className={th}>Status</th>
            <th className={`${th} text-right`}>Checks</th>
            <th className={`${th} text-right`}>Uptime</th>
            <th className={`${th} text-right`}>Avg</th>
            <th className={`${th} text-right`}>p50</th>
            <th className={`${th} text-right`}>p95</th>
            <th className={`${th} text-right`}>p99</th>
            <th className={`${th} hidden text-right lg:table-cell`}>Min / Max</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line font-mono tabular-nums">
          {apis.map((api) => {
            const slow = api.latency.p95 !== null && api.latency.p95 > degradedAfterMs;
            return (
              <tr key={api.id} className="transition-colors hover:bg-white/[0.02]">
                <td className={`${td} font-sans text-neutral-200`}>
                  <span className="block max-w-56 truncate">{api.name}</span>
                </td>
                <td className={`${td} font-sans`}>
                  <StatusBadge health={api.status} />
                </td>
                <td className={`${td} text-right text-neutral-400`}>
                  {api.checks.toLocaleString("en")}
                  {api.failedChecks > 0 && <span className="text-red-400"> ({api.failedChecks} failed)</span>}
                </td>
                <td className={`${td} text-right text-neutral-200`}>{percent(api.uptimePercent)}</td>
                <td className={`${td} text-right text-neutral-200`}>{ms(api.latency.avg)}</td>
                <td className={`${td} text-right text-neutral-400`}>{ms(api.latency.p50)}</td>
                <td className={`${td} text-right ${slow ? "text-amber-400" : "text-neutral-400"}`}>{ms(api.latency.p95)}</td>
                <td className={`${td} text-right text-neutral-400`}>{ms(api.latency.p99)}</td>
                <td className={`${td} hidden text-right text-neutral-500 lg:table-cell`}>
                  {ms(api.latency.min)} / {ms(api.latency.max)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
