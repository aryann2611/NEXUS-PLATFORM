export interface HealthStatus {
  status: "ok";
  service: "nexus";
  timestamp: string;
  monitoring: {
    running: boolean;
    /** When the engine last finished a pass over due APIs. */
    lastRunAt: string | null;
  };
}
