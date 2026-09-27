import { Search } from "lucide-react";
import type { ApiSort, HealthFilter } from "../../lib/apis";
import { Input, Select } from "../common/Form";

const statusFilters: { value: HealthFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "healthy", label: "Healthy" },
  { value: "degraded", label: "Degraded" },
  { value: "down", label: "Down" },
];

interface ApiFiltersProps {
  query: string;
  onQueryChange: (query: string) => void;
  status: HealthFilter;
  onStatusChange: (status: HealthFilter) => void;
  sort: ApiSort;
  onSortChange: (sort: ApiSort) => void;
  counts: Record<HealthFilter, number>;
}

export default function ApiFilters({ query, onQueryChange, status, onStatusChange, sort, onSortChange, counts }: ApiFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full sm:w-64">
        <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-neutral-500" />
        <Input type="search" value={query} onChange={(e) => onQueryChange(e.target.value)} placeholder="Search APIs…" aria-label="Filter APIs" className="pl-9" />
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            aria-pressed={status === filter.value}
            onClick={() => onStatusChange(filter.value)}
            className={`h-8 rounded-full border px-3 text-xs transition-colors ${
              status === filter.value
                ? "border-neutral-400 bg-white/[0.06] text-neutral-50"
                : "border-line text-neutral-400 hover:border-line-strong hover:text-neutral-200"
            }`}
          >
            {filter.label} ({counts[filter.value]})
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-xs text-neutral-500 sm:ml-auto">
        Sort by
        <span className="w-36">
          <Select value={sort} onChange={(e) => onSortChange(e.target.value as ApiSort)}>
            <option value="lastChecked">Last check</option>
            <option value="name">Name</option>
            <option value="latency">Latency</option>
            <option value="uptime">Uptime</option>
          </Select>
        </span>
      </label>
    </div>
  );
}
