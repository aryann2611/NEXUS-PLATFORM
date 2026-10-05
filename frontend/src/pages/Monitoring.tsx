import ActivityTable from "../components/apis/ActivityTable";
import { Badge } from "../components/common/Badge";
import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";
import UptimeHistory from "../components/monitoring/UptimeHistory";
import { useOverview } from "../hooks/useOverview";

export default function Monitoring() {
  const { overview, failed } = useOverview();
  const windowDays = overview?.uptimeWindowDays ?? 45;

  return (
    <div className="stagger space-y-6">
      <PageHeader
        eyebrow="Observe"
        title="Monitoring"
        description="Uptime history and check events from the health-check engine."
        actions={failed ? <Badge tone="down">Couldn't load metrics</Badge> : undefined}
      />

      <Card title="Uptime" description={`Daily status over the last ${windowDays} days`}>
        <UptimeHistory rows={overview?.uptimeHistory ?? []} windowDays={windowDays} />
      </Card>

      <Card title="Activity" description="Latest checks and status changes across your APIs">
        <ActivityTable events={overview?.activity ?? []} />
      </Card>
    </div>
  );
}
