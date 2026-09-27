// Sample data — replace with stored check results once the monitoring engine exists.
import type { Health } from "../types/api";
import type { UptimeHistoryRow } from "../types/metrics";

export const uptimeWindowDays = 45;

const days = (incidents: Record<number, Health>): Health[] =>
  Array.from({ length: uptimeWindowDays }, (_, day) => incidents[day] ?? "healthy");

export const uptimeHistory: UptimeHistoryRow[] = [
  { apiName: "SWASTR API", uptimePercent: 99.98, days: days({ 17: "degraded" }) },
  { apiName: "E-Commerce API", uptimePercent: 99.95, days: days({ 8: "degraded", 33: "degraded" }) },
  { apiName: "Payment Service", uptimePercent: 98.21, days: days({ 21: "down", 40: "degraded", 43: "degraded", 44: "degraded" }) },
  { apiName: "Auth Service", uptimePercent: 99.99, days: days({}) },
];
