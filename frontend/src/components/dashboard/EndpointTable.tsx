import { timeAgo } from "../../lib/format";
import type { Endpoint } from "../../types/api";
import { StatusBadge } from "../common/Badge";

const th = "px-5 py-2.5 font-medium";

export default function EndpointTable({ endpoints }: { endpoints: Endpoint[] }) {
  return (
    <div className="overflow-x-auto border-t border-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-neutral-500">
            <th className={th}>Method</th>
            <th className={th}>Endpoint</th>
            <th className={th}>Status</th>
            <th className={`${th} text-right`}>Latency</th>
            <th className={`${th} hidden text-right md:table-cell`}>Error rate</th>
            <th className={`${th} hidden text-right sm:table-cell`}>Last checked</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {endpoints.map((endpoint) => (
            <tr key={endpoint.id} className="transition-colors hover:bg-white/[0.02]">
              <td className="px-5 py-3">
                <span className="inline-block w-14 rounded border border-line bg-surface-3 py-0.5 text-center font-mono text-[11px] font-medium text-neutral-300">
                  {endpoint.method}
                </span>
              </td>
              <td className="px-5 py-3 font-mono whitespace-nowrap text-neutral-200">{endpoint.path}</td>
              <td className="px-5 py-3">
                <StatusBadge health={endpoint.health} />
              </td>
              <td className="px-5 py-3 text-right font-mono text-neutral-200">{endpoint.latencyMs}ms</td>
              <td className="hidden px-5 py-3 text-right font-mono text-neutral-400 md:table-cell">{endpoint.errorRatePercent.toFixed(2)}%</td>
              <td className="hidden px-5 py-3 text-right whitespace-nowrap text-neutral-500 sm:table-cell">{timeAgo(endpoint.lastCheckedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
