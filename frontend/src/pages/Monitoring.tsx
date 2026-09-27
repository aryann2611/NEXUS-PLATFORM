import ActivityTable from "../components/apis/ActivityTable";
import { Badge } from "../components/common/Badge";
import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";
import UptimeHistory from "../components/monitoring/UptimeHistory";
import { activityLog } from "../mock/apis";
import { uptimeHistory, uptimeWindowDays } from "../mock/monitoring";

export default function Monitoring() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Observe"
        title="Monitoring"
        description="Uptime history and check events. The monitoring engine isn't connected yet."
        actions={<Badge>Sample data</Badge>}
      />

      <Card title="Uptime" description={`Daily status over the last ${uptimeWindowDays} days`}>
        <UptimeHistory rows={uptimeHistory} windowDays={uptimeWindowDays} />
      </Card>

      <Card title="Activity" description="Checks and status changes across your APIs">
        <ActivityTable events={activityLog} />
      </Card>
    </div>
  );
}
