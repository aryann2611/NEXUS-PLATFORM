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
    <div className="min-h-dvh overflow-x-hidden">
      <Sidebar open={menuOpen} health={health} onNavigate={() => setMenuOpen(false)} />
      {menuOpen && <div aria-hidden className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)} />}

      <div className="lg:pl-72">
        <Header menuOpen={menuOpen} onMenuClick={() => setMenuOpen(true)} />
        <main
          key={pathname}
          className="mx-auto max-w-[1500px] px-4 py-7 motion-safe:animate-fade-in sm:px-6 lg:px-10 lg:py-10"
        >
          <Outlet context={{ health } satisfies LayoutContext} />
        </main>
      </div>
    </div>
  );
}
