import { useEffect, useRef, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Menu, Search, User } from "lucide-react";
import { Button } from "../common/Button";

interface HeaderProps {
  menuOpen: boolean;
  onMenuClick: () => void;
}

export default function Header({ menuOpen, onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = String(new FormData(e.currentTarget).get("q") ?? "").trim();
    navigate({ pathname: "/apis", search: query ? `?${new URLSearchParams({ q: query })}` : "" });
    e.currentTarget.reset();
  }

  return (
    <header className="glass sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b border-line/80 px-4 sm:px-6 lg:px-10">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick} aria-label="Open navigation" aria-expanded={menuOpen} aria-controls="sidebar">
        <Menu size={18} />
      </Button>

      <form role="search" onSubmit={handleSearch} className="relative w-full max-w-lg">
        <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-neutral-500" />
        <input
          ref={searchRef}
          name="q"
          type="search"
          placeholder="Search APIs by name or URL…"
          aria-label="Search APIs"
          className="peer h-10 w-full rounded-xl border border-line bg-surface/80 pr-16 pl-9 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-500 hover:border-line-strong focus:border-neutral-400/60 focus:ring-4 focus:ring-white/10"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 gap-1 font-sans text-[11px] text-neutral-500 sm:peer-placeholder-shown:flex">
          <span className="rounded border border-line bg-surface-3 px-1.5 py-0.5">Ctrl</span>
          <span className="rounded border border-line bg-surface-3 px-1.5 py-0.5">K</span>
        </kbd>
      </form>

      <div className="ml-auto flex items-center gap-2">
        <span title="Notifications arrive with alerting in a later phase">
          <Button variant="ghost" size="icon" disabled aria-label="Notifications (coming soon)">
            <Bell size={18} />
          </Button>
        </span>
        <span aria-hidden className="grid size-9 place-items-center rounded-full border border-line bg-surface-3 text-neutral-400">
          <User size={16} />
        </span>
      </div>
    </header>
  );
}
