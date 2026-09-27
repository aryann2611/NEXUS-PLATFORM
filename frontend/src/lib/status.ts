import type { Health } from "../types/api";
import type { BackendStatus } from "../types/health";

export type Tone = "healthy" | "degraded" | "down" | "neutral";

export const toneText: Record<Tone, string> = {
  healthy: "text-green-400",
  degraded: "text-amber-400",
  down: "text-red-400",
  neutral: "text-neutral-400",
};

export const toneDot: Record<Tone, string> = {
  healthy: "bg-green-500",
  degraded: "bg-amber-500",
  down: "bg-red-500",
  neutral: "bg-neutral-500",
};

export const toneSoft: Record<Tone, string> = {
  healthy: "border-green-500/20 bg-green-500/10",
  degraded: "border-amber-500/20 bg-amber-500/10",
  down: "border-red-500/20 bg-red-500/10",
  neutral: "border-white/10 bg-white/5",
};

export const healthTone: Record<Health, Tone> = {
  healthy: "healthy",
  degraded: "degraded",
  down: "down",
  pending: "neutral",
};

export const healthLabel: Record<Health, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  down: "Down",
  pending: "Pending",
};

export const backendTone: Record<BackendStatus, Tone> = {
  checking: "neutral",
  connected: "healthy",
  disconnected: "down",
};

export const backendLabel: Record<BackendStatus, string> = {
  checking: "Checking…",
  connected: "Connected",
  disconnected: "Disconnected",
};
