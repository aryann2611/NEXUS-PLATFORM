import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

export default function Card({ title, description, actions, className = "", children }: CardProps) {
  return (
    <section className={`overflow-hidden rounded-xl border border-line bg-surface ${className}`}>
      {title && (
        <header className="flex flex-wrap items-start justify-between gap-3 p-5 pb-4">
          <div>
            <h2 className="font-medium text-neutral-100">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-neutral-500">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}
