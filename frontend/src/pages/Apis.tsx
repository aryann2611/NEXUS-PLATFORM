import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, CircleAlert, CircleX, HeartPulse, Layers, LoaderCircle, Plus, SearchX, TriangleAlert } from "lucide-react";
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
import { useApis } from "../hooks/useApis";
import { countByHealth, filterApis, type ApiSort, type HealthFilter } from "../lib/apis";
import { percentOf } from "../lib/format";
import { activityLog } from "../mock/apis";

export default function Apis() {
  const { apis, state, error, reload, addApi } = useApis();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState<HealthFilter>("all");
  const [sort, setSort] = useState<ApiSort>("lastChecked");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const query = params.get("q") ?? "";
  const ready = state === "ready";
  const counts = countByHealth(apis);
  const visibleApis = filterApis(apis, query, status, sort);
  const count = (n: number) => (ready ? String(n) : "—");
  const shareOfTotal = (n: number) => (ready ? `${percentOf(n, counts.all)}% of total` : "—");

  const emptyState =
    state === "loading"
      ? { icon: LoaderCircle, title: "Loading APIs…", description: "Fetching your registered APIs." }
      : state === "error"
        ? { icon: CircleAlert, title: "Couldn't load APIs", description: error }
        : apis.length === 0
          ? { icon: Plus, title: "No APIs registered yet", description: "Add your first API to start monitoring it." }
          : { icon: SearchX, title: "No APIs match your filters", description: "Try a different search term or status filter." };

  return (
    <div className="stagger space-y-6">
      <PageHeader
        eyebrow="Observe"
        title="APIs"
        description="Manage the APIs you want NEXUS to monitor and test."
        actions={
          <Button onClick={() => setDrawerOpen(true)}>
            <Plus size={16} /> Add API
          </Button>
        }
      />

      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total APIs" value={count(counts.all)} hint="Registered" icon={Layers} />
        <StatCard label="Healthy" value={count(counts.healthy)} hint={shareOfTotal(counts.healthy)} icon={HeartPulse} tone="healthy" />
        <StatCard label="Degraded" value={count(counts.degraded)} hint={shareOfTotal(counts.degraded)} icon={TriangleAlert} tone="degraded" />
        <StatCard label="Down" value={count(counts.down)} hint={shareOfTotal(counts.down)} icon={CircleX} tone="down" />
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

      {ready && visibleApis.length > 0 ? (
        <div className="stagger grid grid-cols-1 gap-4 xl:grid-cols-2">
          {visibleApis.map((api) => (
            <ApiCard key={api.id} api={api} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-line">
          <EmptyState {...emptyState}>
            {state === "error" && (
              <Button variant="secondary" size="sm" onClick={reload}>
                Try again
              </Button>
            )}
          </EmptyState>
        </div>
      )}

      <Card
        title="Recent Activity"
        description="Latest checks and status changes across your APIs."
        actions={
          <div className="flex items-center gap-3">
            <Badge>Sample data</Badge>
            <ButtonLink to="/monitoring" size="sm">
              View All Activity <ArrowRight size={14} />
            </ButtonLink>
          </div>
        }
      >
        <ActivityTable events={activityLog.slice(0, 4)} />
      </Card>

      <AddApiDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onSubmit={addApi} />
    </div>
  );
}
