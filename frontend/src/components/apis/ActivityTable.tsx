import { Activity, CircleAlert, LoaderCircle } from "lucide-react";
import type { LoadState } from "../../hooks/useApis";
import { timeAgo } from "../../lib/format";
import { healthTone, toneText } from "../../lib/status";
import type { ActivityItem } from "../../types/activity";
import { StatusDot } from "../common/Badge";
import EmptyState from "../common/EmptyState";

const th = "px-5 py-2.5 font-medium";

const details = (item: ActivityItem) =>
  item.statusCode !== null ? `${item.statusCode}${item.latencyMs !== null ? ` · ${item.latencyMs}ms` : ""}` : (item.error ?? "No response");

interface ActivityTableProps {
  items: ActivityItem[];
  state: LoadState;
  error?: string;
  emptyText?: string;
}

export default function ActivityTable({ items, state, error, emptyText = "Checks appear here as the monitoring engine runs." }: ActivityTableProps) {
  if (items.length === 0) {
    const empty =
      state === "loading"
        ? { icon: LoaderCircle, title: "Loading activity…", description: "Fetching recent checks." }
        : state === "error"
          ? { icon: CircleAlert, title: "Couldn't load activity", description: error ?? "" }
          : { icon: Activity, title: "No activity yet", description: emptyText };
    return (
      <div className="border-t border-line">
        <EmptyState {...empty} />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border-t border-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-neutral-500">
            <th className={`${th} hidden sm:table-cell`}>Time</th>
            <th className={th}>API</th>
            <th className={th}>Event</th>
            <th className={`${th} hidden md:table-cell`}>Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.map((item) => {
            const tone = healthTone[item.outcome];
            return (
              <tr key={item.id} className="transition-colors hover:bg-white/[0.02]">
                <td className="hidden px-5 py-3 whitespace-nowrap text-neutral-500 sm:table-cell">{timeAgo(item.checkedAt, "long")}</td>
                <td className="px-5 py-3 whitespace-nowrap text-neutral-200">{item.apiName}</td>
                <td className="px-5 py-3">
                  <span className={`flex items-center gap-2 whitespace-nowrap ${item.outcome === "healthy" ? "text-neutral-300" : toneText[tone]}`}>
                    <StatusDot tone={tone} />
                    {item.event}
                  </span>
                </td>
                <td className="hidden max-w-80 truncate px-5 py-3 font-mono text-xs whitespace-nowrap text-neutral-400 md:table-cell">{details(item)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
