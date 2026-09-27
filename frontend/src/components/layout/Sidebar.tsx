import { NavLink } from "react-router-dom";
import { Activity, Box, ChartColumn, LayoutDashboard, Settings, Zap, type LucideIcon } from "lucide-react";
import type { HealthState } from "../../hooks/useHealth";
import { backendLabel, backendTone, toneText } from "../../lib/status";
import { StatusDot } from "../common/Badge";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const sections: { label: string; items: NavItem[] }[] = [
  { label: "Overview", items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
    label: "Observe",
    items: [
      { to: "/apis", label: "APIs", icon: Box },
      { to: "/monitoring", label: "Monitoring", icon: Activity },
    ],
  },
  { label: "Test", items: [{ to: "/load-tests", label: "Load Tests", icon: Zap }] },
  { label: "Analyze", items: [{ to: "/reports", label: "Reports", icon: ChartColumn }] },
];

function SidebarLink({ to, label, icon: Icon, onClick }: NavItem & { onClick: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
          isActive
            ? "bg-white/[0.06] text-neutral-50 before:absolute before:inset-y-1.5 before:-left-3 before:w-0.5 before:rounded-r before:bg-neutral-50"
            : "text-neutral-400 hover:bg-white/[0.03] hover:text-neutral-100"
        }`
      }
    >
      <Icon size={18} strokeWidth={1.75} />
      {label}
    </NavLink>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className="size-8 text-neutral-50" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path d="M8 24V8l16 16V8" />
      <path d="M12 8l12 12" strokeOpacity={0.35} />
    </svg>
  );
}

function BackendStatus({ health }: { health: HealthState }) {
  const tone = backendTone[health.status];
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3">
      <p className="text-xs text-neutral-500">Backend</p>
      <p className={`mt-1 flex items-center gap-2 text-sm font-medium ${toneText[tone]}`}>
        <StatusDot tone={tone} pulse={health.status === "checking"} />
        {backendLabel[health.status]}
      </p>
      <p className="mt-0.5 font-mono text-xs text-neutral-500">
        {health.status === "connected" && `NEXUS API · ${health.latencyMs}ms`}
        {health.status === "disconnected" && "Retrying every 30s"}
        {health.status === "checking" && "GET /api/health"}
      </p>
    </div>
  );
}

interface SidebarProps {
  open: boolean;
  health: HealthState;
  onNavigate: () => void;
}

export default function Sidebar({ open, health, onNavigate }: SidebarProps) {
  return (
    <aside
      id="sidebar"
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface bg-[radial-gradient(140%_45%_at_0%_100%,rgb(255_255_255/0.05),transparent_70%)] transition-transform duration-200 lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex h-20 items-center gap-3 px-6">
        <Logo />
        <div>
          <p className="text-lg leading-none font-semibold tracking-[0.3em]">NEXUS</p>
          <p className="mt-1 text-xs text-neutral-500">API Intelligence</p>
        </div>
      </div>

      <nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">{section.label}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <SidebarLink {...item} onClick={onNavigate} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-2 p-3">
        <BackendStatus health={health} />
        <SidebarLink to="/settings" label="Settings" icon={Settings} onClick={onNavigate} />
      </div>
    </aside>
  );
}
