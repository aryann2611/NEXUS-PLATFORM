export type Health = "healthy" | "degraded" | "down" | "pending";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** A registered API as returned by GET /api/projects. */
export interface Project {
  id: string;
  name: string;
  baseUrl: string;
  description: string | null;
  tags: string[];
  status: Health;
  checkInterval: number;
  timeout: number;
  createdAt: string;
  updatedAt: string;
  uptimePercent: number | null;
  avgLatencyMs: number | null;
  lastCheckedAt: string | null;
  latencyTrend: number[];
}

export interface MonitoredApi {
  id: string;
  name: string;
  baseUrl: string;
  health: Health;
  endpointCount: number | null;
  uptimePercent: number | null;
  avgLatencyMs: number | null;
  lastCheckedAt: string | null;
  latencyTrend: number[];
}

/** Values collected by the Add API drawer; sent to POST /api/projects. */
export interface NewApiInput {
  name: string;
  baseUrl: string;
  description: string;
  tags: string[];
  checkIntervalSeconds: number;
  timeoutSeconds: number;
  uptimeMonitoring: boolean;
  performanceMonitoring: boolean;
  errorTracking: boolean;
}

export interface Endpoint {
  id: string;
  method: HttpMethod;
  path: string;
  health: Health;
  latencyMs: number;
  errorRatePercent: number;
  lastCheckedAt: string;
}

export interface ActivityEvent {
  id: string;
  at: string;
  apiName: string;
  event: string;
  health: Health;
  details: string;
}
