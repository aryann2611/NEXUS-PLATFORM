import { useId } from "react";

interface SparklineProps {
  values: number[];
  /** Text color class; the line and fill use currentColor. */
  className?: string;
}

export default function Sparkline({ values, className = "" }: SparklineProps) {
  const gradientId = useId();
  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;
  const points = values
    .map((value, i) => `${(i / (values.length - 1)) * 100},${36 - ((value - min) / range) * 30}`)
    .join(" ");

  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden className={`h-10 w-24 shrink-0 ${className}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,40 ${points} 100,40`} fill={`url(#${gradientId})`} />
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
