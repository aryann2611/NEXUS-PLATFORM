// Sample data — replace with the API registry endpoint once it exists.
import type { ActivityEvent, MonitoredApi } from "../types/api";
import { secondsAgo } from "./time";

export const mockApis: MonitoredApi[] = [
  {
    id: "swastr",
    name: "SWASTR API",
    baseUrl: "https://api.swastr.example.com",
    health: "healthy",
    endpointCount: 12,
    uptimePercent: 99.98,
    avgLatencyMs: 143,
    lastCheckedAt: secondsAgo(4),
    latencyTrend: [152, 148, 139, 151, 144, 136, 149, 141, 143],
  },
  {
    id: "ecommerce",
    name: "E-Commerce API",
    baseUrl: "https://shop.example.com",
    health: "healthy",
    endpointCount: 8,
    uptimePercent: 99.95,
    avgLatencyMs: 210,
    lastCheckedAt: secondsAgo(12),
    latencyTrend: [198, 214, 205, 221, 209, 202, 216, 207, 210],
  },
  {
    id: "payments",
    name: "Payment Service",
    baseUrl: "https://payments.example.com",
    health: "degraded",
    endpointCount: 6,
    uptimePercent: 98.21,
    avgLatencyMs: 842,
    lastCheckedAt: secondsAgo(8),
    latencyTrend: [412, 468, 455, 590, 612, 701, 688, 796, 842],
  },
  {
    id: "auth",
    name: "Auth Service",
    baseUrl: "https://auth.example.com",
    health: "healthy",
    endpointCount: 4,
    uptimePercent: 99.99,
    avgLatencyMs: 98,
    lastCheckedAt: secondsAgo(8),
    latencyTrend: [104, 96, 101, 93, 99, 95, 102, 97, 98],
  },
];

export const apiCountTrends = {
  total: [2, 2, 3, 3, 3, 3, 4, 4],
  healthy: [2, 2, 3, 2, 3, 3, 3, 3],
  degraded: [0, 0, 0, 1, 0, 0, 1, 1],
  down: [0, 0, 0, 0, 0, 0, 0, 0],
};

export const activityLog: ActivityEvent[] = [
  { id: "a1", at: secondsAgo(120), apiName: "SWASTR API", event: "Health check", health: "healthy", details: "200 OK · 124ms" },
  { id: "a2", at: secondsAgo(300), apiName: "Payment Service", event: "High latency", health: "degraded", details: "842ms (threshold 500ms)" },
  { id: "a3", at: secondsAgo(720), apiName: "E-Commerce API", event: "Health check", health: "healthy", details: "200 OK · 98ms" },
  { id: "a4", at: secondsAgo(1_080), apiName: "Auth Service", event: "Health check", health: "healthy", details: "200 OK · 110ms" },
  { id: "a5", at: secondsAgo(2_460), apiName: "Payment Service", event: "Recovered", health: "healthy", details: "200 OK · 388ms" },
  { id: "a6", at: secondsAgo(2_520), apiName: "Payment Service", event: "Timeout", health: "down", details: "No response after 10s" },
  { id: "a7", at: secondsAgo(5_400), apiName: "E-Commerce API", event: "Health check", health: "healthy", details: "200 OK · 204ms" },
  { id: "a8", at: secondsAgo(9_000), apiName: "SWASTR API", event: "Health check", health: "healthy", details: "200 OK · 139ms" },
];
