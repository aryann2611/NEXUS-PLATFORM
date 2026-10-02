import { Activity, ChartLine, FileText, Gauge, Zap } from "lucide-react";
import { Badge } from "../components/common/Badge";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHeader";

const reportTypes = [
  { icon: Gauge, title: "Performance", description: "Latency percentiles and throughput per endpoint." },
  { icon: Activity, title: "Uptime", description: "Availability and incident history per API." },
  { icon: Zap, title: "Load Tests", description: "Results and comparisons across load-test runs." },
  { icon: ChartLine, title: "Historical Analytics", description: "Long-term trends and regressions over time." },
];

export default function Reports() {
  return (
    <div className="stagger space-y-6">
      <PageHeader eyebrow="Analyze" title="Reports" description="Performance, uptime and load-test reports for your APIs." />

      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {reportTypes.map(({ icon: Icon, title, description }) => (
          <div key={title} className="surface-card group p-5 transition duration-300 hover:-translate-y-1 hover:border-line-strong">
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-10 place-items-center rounded-xl border border-line bg-surface-3 text-neutral-300 transition-transform duration-300 group-hover:scale-110">
                <Icon size={17} />
              </span>
              <Badge>Coming soon</Badge>
            </div>
            <h2 className="mt-5 font-semibold text-neutral-100">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-neutral-400">{description}</p>
          </div>
        ))}
      </div>

      <Card title="Generated Reports">
        <div className="border-t border-line">
          <EmptyState icon={FileText} title="No reports yet" description="Reports will be generated from real monitoring and load-test data in a later phase." />
        </div>
      </Card>
    </div>
  );
}
