import { useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { ArrowRight, CircleX, HeartPulse, Layers, Plus, SearchX, TriangleAlert } from "lucide-react";
import ActivityTable from "../components/apis/ActivityTable";
import AddApiDrawer from "../components/apis/AddApiDrawer";
import ApiCard from "../components/apis/ApiCard";
import ApiFilters from "../components/apis/ApiFilters";
import { Badge } from "../components/common/Badge";
import { Button, ButtonLink } from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHeader";
import StatCard from "../components/common/StatCard";
import type { LayoutContext } from "../components/layout/AppLayout";
import { countByHealth, filterApis, type ApiSort, type HealthFilter } from "../lib/apis";
import { percentOf } from "../lib/format";
import { activityLog, apiCountTrends } from "../mock/apis";

export default function Apis() {
  const { apis, addApi } = useOutletContext<LayoutContext>();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState<HealthFilter>("all");
  const [sort, setSort] = useState<ApiSort>("lastChecked");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const query = params.get("q") ?? "";
  const counts = countByHealth(apis);
  const visibleApis = filterApis(apis, query, status, sort);
  const shareOfTotal = (n: number) => `${percentOf(n, counts.all)}% of total`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Observe"
        title="APIs"
        description="Manage the APIs you want NEXUS to monitor and test."
        actions={
          <>
            <Badge>Sample data</Badge>
            <Button onClick={() => setDrawerOpen(true)}>
              <Plus size={16} /> Add API
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total APIs" value={String(counts.all)} hint="Registered" icon={Layers} trend={apiCountTrends.total} />
        <StatCard label="Healthy" value={String(counts.healthy)} hint={shareOfTotal(counts.healthy)} icon={HeartPulse} tone="healthy" trend={apiCountTrends.healthy} />
        <StatCard label="Degraded" value={String(counts.degraded)} hint={shareOfTotal(counts.degraded)} icon={TriangleAlert} tone="degraded" trend={apiCountTrends.degraded} />
        <StatCard label="Down" value={String(counts.down)} hint={shareOfTotal(counts.down)} icon={CircleX} tone="down" trend={apiCountTrends.down} />
      </div>

      <ApiFilters
        query={query}
        onQueryChange={(q) => setParams(q ? { q } : {}, { replace: true })}
        status={status}
        onStatusChange={setStatus}
        sort={sort}
        onSortChange={setSort}
        counts={counts}
      />

      {visibleApis.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {visibleApis.map((api) => (
            <ApiCard key={api.id} api={api} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-line">
          <EmptyState icon={SearchX} title="No APIs match your filters" description="Try a different search term or status filter." />
        </div>
      )}

      <Card
        title="Recent Activity"
        description="Latest checks and status changes across your APIs."
        actions={
          <ButtonLink to="/monitoring" size="sm">
            View All Activity <ArrowRight size={14} />
          </ButtonLink>
        }
      >
        <ActivityTable events={activityLog.slice(0, 4)} />
      </Card>

      <AddApiDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onSubmit={addApi} />
    </div>
  );
}
