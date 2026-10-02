import { timeAgo } from "../../lib/format";
import { healthTone, toneText } from "../../lib/status";
import type { ActivityEvent } from "../../types/api";
import { StatusDot } from "../common/Badge";

const th = "px-5 py-2.5 font-medium";

export default function ActivityTable({ events }: { events: ActivityEvent[] }) {
  return (
    <div className="overflow-x-auto border-t border-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-white/[0.015] text-left text-[10px] font-bold uppercase tracking-[.16em] text-neutral-500">
            <th className={`${th} hidden sm:table-cell`}>Time</th>
            <th className={th}>API</th>
            <th className={th}>Event</th>
            <th className={`${th} hidden md:table-cell`}>Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {events.map((event) => {
            const tone = healthTone[event.health];
            return (
              <tr key={event.id} className="transition-colors duration-200 hover:bg-white/[0.045]">
                <td className="hidden px-5 py-3 whitespace-nowrap text-neutral-500 sm:table-cell">{timeAgo(event.at, "long")}</td>
                <td className="px-5 py-3 whitespace-nowrap text-neutral-200">{event.apiName}</td>
                <td className="px-5 py-3">
                  <span className={`flex items-center gap-2 whitespace-nowrap ${event.health === "healthy" ? "text-neutral-300" : toneText[tone]}`}>
                    <StatusDot tone={tone} />
                    {event.event}
                  </span>
                </td>
                <td className="hidden px-5 py-3 font-mono text-xs whitespace-nowrap text-neutral-400 md:table-cell">{event.details}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
