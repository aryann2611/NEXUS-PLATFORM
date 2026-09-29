import { useState } from "react";
import { Activity } from "lucide-react";
import ActivityTable from "../components/apis/ActivityTable";
import { ButtonLink } from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHeader";
import ApiUptimeList from "../components/reports/ApiUptimeList";
import { useActivity } from "../hooks/useActivity";
import { useReport } from "../hooks/useReport";

export default function Monitoring() {
  const [changesOnly, setChangesOnly] = useState(false);
  const { report } = useReport("30d");
  const activity = useActivity(25, { changesOnly });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Observe"
        title="Monitoring"
        description="Uptime history and live check results from the NEXUS monitoring engine."
        actions={
          <ButtonLink to="/reports?range=30d&tab=uptime" size="sm">
            Uptime report
          </ButtonLink>
        }
      />

      <Card title="Uptime" description="Worst result per day over the last 30 days">
        {report && report.apis.length > 0 ? (
          <ApiUptimeList report={report} />
        ) : (
          <div className="border-t border-line">
            <EmptyState icon={Activity} title={report ? "No APIs registered yet" : "Loading uptime…"} description="Each registered API gets a row here." />
          </div>
        )}
      </Card>

      <Card
        title="Activity"
        description={changesOnly ? "Status changes over the last 7 days, newest first" : "Latest checks across your APIs, newest first"}
        actions={
          <div className="flex gap-2" role="group" aria-label="Activity filter">
            {[
              { value: false, label: "All checks" },
              { value: true, label: "Status changes" },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                aria-pressed={changesOnly === option.value}
                onClick={() => setChangesOnly(option.value)}
                className={`h-8 rounded-full border px-3 text-xs transition-colors ${
                  changesOnly === option.value
                    ? "border-neutral-400 bg-white/[0.06] text-neutral-50"
                    : "border-line text-neutral-400 hover:border-line-strong hover:text-neutral-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      >
        <ActivityTable
          items={activity.items}
          state={activity.state}
          error={activity.error}
          emptyText={changesOnly ? "No API has changed status in the last 7 days." : undefined}
        />
      </Card>
    </div>
  );
}
