import { timeAgo } from "../../lib/format";
import type { MonitoredApi } from "../../types/api";
import { StatusBadge } from "../common/Badge";

const th = "px-5 py-2.5 font-medium";

export default function ApiStatusTable({ apis }: { apis: MonitoredApi[] }) {
  return (
    <div className="overflow-x-auto border-t border-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-white/[0.015] text-left text-[10px] font-bold uppercase tracking-[.16em] text-neutral-500">
            <th className={th}>API</th>
            <th className={th}>Status</th>
            <th className={`${th} text-right`}>Avg latency</th>
            <th className={`${th} hidden text-right md:table-cell`}>Uptime (30d)</th>
            <th className={`${th} hidden text-right sm:table-cell`}>Last checked</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {apis.map((api) => (
            <tr key={api.id} className="transition-colors duration-200 hover:bg-white/[0.045]">
              <td className="px-5 py-3 whitespace-nowrap text-neutral-200">{api.name}</td>
              <td className="px-5 py-3">
                <StatusBadge health={api.health} />
              </td>
              <td className="px-5 py-3 text-right font-mono text-neutral-200">{api.avgLatencyMs === null ? "—" : `${api.avgLatencyMs}ms`}</td>
              <td className="hidden px-5 py-3 text-right font-mono text-neutral-400 md:table-cell">{api.uptimePercent === null ? "—" : `${api.uptimePercent}%`}</td>
              <td className="hidden px-5 py-3 text-right whitespace-nowrap text-neutral-500 sm:table-cell">{api.lastCheckedAt ? timeAgo(api.lastCheckedAt) : "Never"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
