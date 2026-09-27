import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useHealth, type HealthState } from "../../hooks/useHealth";
import Header from "./Header";
import Sidebar from "./Sidebar";

export interface LayoutContext {
  health: HealthState;
}

export default function AppLayout() {
  const health = useHealth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <div className="min-h-dvh">
      <Sidebar open={menuOpen} health={health} onNavigate={() => setMenuOpen(false)} />
      {menuOpen && <div aria-hidden className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setMenuOpen(false)} />}

      <div className="lg:pl-64">
        <Header menuOpen={menuOpen} onMenuClick={() => setMenuOpen(true)} />
        <main
          key={pathname}
          className="mx-auto max-w-7xl bg-[radial-gradient(80%_40%_at_100%_0%,rgb(255_255_255/0.025),transparent)] px-4 py-6 motion-safe:animate-fade-in sm:px-6 lg:px-8 lg:py-8"
        >
          <Outlet context={{ health } satisfies LayoutContext} />
        </main>
      </div>
    </div>
  );
}
