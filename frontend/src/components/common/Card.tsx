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
    <section className={`surface-card ${className}`}>
      {title && (
        <header className="relative flex flex-wrap items-start justify-between gap-3 p-5 pb-4 sm:p-6 sm:pb-4">
          <div>
            <h2 className="font-semibold tracking-tight text-neutral-100">{title}</h2>
            {description && <p className="mt-1 text-sm text-neutral-400">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}
