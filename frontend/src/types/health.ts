export interface HealthResponse {
  status: "ok";
  service: "nexus";
  timestamp: string;
  monitoring: {
    running: boolean;
    lastRunAt: string | null;
  };
}

export type BackendStatus = "checking" | "connected" | "disconnected";
