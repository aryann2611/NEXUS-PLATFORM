import type { NewApiInput, Project } from "../types/api";
import type { HealthResponse } from "../types/health";
import type { Overview } from "../types/metrics";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, signal: AbortSignal.timeout(5_000) });
  } catch {
    throw new Error("Can't reach the NEXUS API. Is the backend running?");
  }

  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (body as { error?: { message?: string } } | null)?.error?.message;
    throw new Error(message ?? `Request failed with status ${res.status}`);
  }
  return body as T;
}

export const getHealth = () => request<HealthResponse>("/api/health");

export async function getProjects(): Promise<Project[]> {
  return (await request<{ data: Project[] }>("/api/projects")).data;
}

export async function createProject(input: NewApiInput): Promise<Project> {
  const { data } = await request<{ data: Project }>("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name,
      baseUrl: input.baseUrl,
      description: input.description,
      tags: input.tags,
      checkInterval: input.checkIntervalSeconds,
      timeout: input.timeoutSeconds,
    }),
  });
  return data;
}

export async function getOverview(): Promise<Overview> {
  return (await request<{ data: Overview }>("/api/metrics/overview")).data;
}
