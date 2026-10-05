export interface LatencyPoint {
  time: string;
  /** null where nothing was measured; the chart leaves a gap. */
  p50: number | null;
  p95: number | null;
}
