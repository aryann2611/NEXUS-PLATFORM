import type { ReactNode } from "react";
import { healthLabel, healthTone, toneDot, toneSoft, toneText, type Tone } from "../../lib/status";
import type { Health } from "../../types/api";

export function StatusDot({ tone, pulse = false }: { tone: Tone; pulse?: boolean }) {
  return <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${toneDot[tone]} ${pulse ? "animate-pulse" : ""}`} />;
}

interface BadgeProps {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
}

export function Badge({ tone = "neutral", dot = false, children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${toneSoft[tone]} ${toneText[tone]}`}>
      {dot && <StatusDot tone={tone} />}
      {children}
    </span>
  );
}

export function StatusBadge({ health }: { health: Health }) {
  return (
    <Badge tone={healthTone[health]} dot>
      {healthLabel[health]}
    </Badge>
  );
}
