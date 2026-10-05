export interface HealthResponse {
  status: "ok";
  service: "nexus";
  timestamp: string;
  monitoring: {
    running: boolean;
    lastRunAt: string | null;
  };
  alerting: {
    webhookConfigured: boolean;
  };
}

export type BackendStatus = "checking" | "connected" | "disconnected";
