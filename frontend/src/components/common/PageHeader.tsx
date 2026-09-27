import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export default function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <title>{`${title} · NEXUS`}</title>
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-50 sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-neutral-400 sm:text-base">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
