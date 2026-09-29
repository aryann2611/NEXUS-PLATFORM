// Mirrors backend/src/types/activity.ts (GET /api/activity).
import type { CheckOutcome } from "./report";

export type ActivityEventName = "Health check" | "Went down" | "Slow response" | "Recovered";

export interface ActivityItem {
  id: string;
  checkedAt: string;
  apiId: string;
  apiName: string;
  outcome: CheckOutcome;
  event: ActivityEventName;
  statusCode: number | null;
  latencyMs: number | null;
  error: string | null;
}
