const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

export function timeAgo(iso: string, style: Intl.RelativeTimeFormatStyle = "narrow"): string {
  const format = new Intl.RelativeTimeFormat("en", { numeric: "auto", style });
  const seconds = Math.round((Date.parse(iso) - Date.now()) / 1000);
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
  }
  return format.format(seconds, "second");
}

const compactFormat = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export const compactNumber = (value: number) => compactFormat.format(value);

export const percentOf = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0);
