export interface HealthStatus {
  status: "ok";
  service: "nexus";
  timestamp: string;
  monitoring: {
    running: boolean;
    /** When the engine last finished a pass over due APIs. */
    lastRunAt: string | null;
  };
  alerting: {
    /** Whether ALERT_WEBHOOK_URL is set; the URL itself is never exposed. */
    webhookConfigured: boolean;
  };
}
