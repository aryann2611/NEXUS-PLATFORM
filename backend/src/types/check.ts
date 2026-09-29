export type CheckOutcome = "healthy" | "degraded" | "down";

export interface CheckRecord {
  projectId: string;
  checkedAt: Date;
  outcome: CheckOutcome;
  statusCode: number | null;
  latencyMs: number | null;
  error: string | null;
}
