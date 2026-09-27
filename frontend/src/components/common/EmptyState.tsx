import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="grid size-10 place-items-center rounded-lg border border-line bg-surface-3 text-neutral-400">
        <Icon size={18} />
      </span>
      <p className="mt-4 text-sm font-medium text-neutral-200">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-neutral-500">{description}</p>
    </div>
  );
}
