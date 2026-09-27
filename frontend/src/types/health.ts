export interface HealthResponse {
  status: "ok";
  service: "nexus";
  timestamp: string;
}

export type BackendStatus = "checking" | "connected" | "disconnected";
