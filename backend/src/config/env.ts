import "dotenv/config";

export const env = {
  port: Number(process.env.PORT) || 3000,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME || "nexus",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD ?? "",
  },
  alerts: {
    // Optional: POSTed a JSON alert when an API goes down or recovers. Unset means no alerts.
    webhookUrl: process.env.ALERT_WEBHOOK_URL || "",
  },
  monitoring: {
    enabled: process.env.MONITORING_ENABLED !== "false",
    // Off by default: the checker fetches user-supplied URLs, so private and internal addresses are refused.
    allowPrivateTargets: process.env.MONITOR_ALLOW_PRIVATE_TARGETS === "true",
    degradedAfterMs: Number(process.env.MONITOR_DEGRADED_AFTER_MS) || 1000,
    retentionDays: Number(process.env.MONITOR_RETENTION_DAYS) || 90,
  },
};
