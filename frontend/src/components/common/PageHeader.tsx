import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export default function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <title>{`${title} · NEXUS`}</title>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] text-neutral-50 sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400 sm:text-base">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
