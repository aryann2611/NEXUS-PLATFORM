import { timeAgo } from "../../lib/format";
import type { LoadTestRun } from "../../types/loadTest";

const th = "px-5 py-3 font-medium whitespace-nowrap";

export default function LoadTestRunsTable({ runs }: { runs: LoadTestRun[] }) {
  return (
    <div className="overflow-x-auto border-t border-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-white/[0.015] text-left text-[10px] font-bold uppercase tracking-[.16em] text-neutral-500">
            <th className={th}>Target</th>
            <th className={`${th} hidden sm:table-cell`}>VUs</th>
            <th className={`${th} hidden sm:table-cell`}>Duration</th>
            <th className={th}>Requests</th>
            <th className={th}>Avg</th>
            <th className={th}>p95</th>
            <th className={th}>Errors</th>
            <th className={`${th} hidden md:table-cell`}>Completed</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {runs.map((run) => (
            <tr key={run.id} className="transition-colors duration-200 hover:bg-white/[0.045]">
              <td className="max-w-56 truncate px-5 py-3 font-mono text-xs text-neutral-200" title={run.url}>
                {run.url}
              </td>
              <td className="hidden px-5 py-3 text-neutral-400 sm:table-cell">{run.vus}</td>
              <td className="hidden px-5 py-3 text-neutral-400 sm:table-cell">{run.durationSeconds}s</td>
              <td className="px-5 py-3 font-mono text-neutral-200">{run.requests.toLocaleString()}</td>
              <td className="px-5 py-3 font-mono text-neutral-200">{Math.round(run.avgLatencyMs)}ms</td>
              <td className="px-5 py-3 font-mono text-neutral-200">{Math.round(run.p95Ms)}ms</td>
              <td className={`px-5 py-3 font-mono ${run.errorRatePercent > 0 ? "text-red-400" : "text-neutral-400"}`}>{run.errorRatePercent.toFixed(2)}%</td>
              <td className="hidden px-5 py-3 whitespace-nowrap text-neutral-500 md:table-cell">{timeAgo(run.completedAt, "long")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
