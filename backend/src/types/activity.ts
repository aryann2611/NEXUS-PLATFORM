import type { CheckOutcome } from "./check.js";

export type ActivityEvent = "Health check" | "Went down" | "Slow response" | "Recovered";

export interface ActivityItem {
  id: string;
  checkedAt: string;
  apiId: string;
  apiName: string;
  outcome: CheckOutcome;
  event: ActivityEvent;
  statusCode: number | null;
  latencyMs: number | null;
  error: string | null;
}
