// Sample data — replace with real check events once the monitoring engine exists.
import type { ActivityEvent } from "../types/api";
import { secondsAgo } from "./time";

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
