import type { ActivityItem } from "../types/activity";
import type { NewApiInput, Project } from "../types/api";
import type { HealthResponse } from "../types/health";
import type { Report, ReportRange } from "../types/report";

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

export async function getReport(range: ReportRange, projectId?: string): Promise<Report> {
  const query = new URLSearchParams({ range });
  if (projectId) query.set("projectId", projectId);
  return (await request<{ data: Report }>(`/api/reports?${query}`)).data;
}

export async function getActivity(options: { limit: number; changesOnly?: boolean; projectId?: string }): Promise<ActivityItem[]> {
  const query = new URLSearchParams({ limit: String(options.limit) });
  if (options.changesOnly) query.set("changes", "true");
  if (options.projectId) query.set("projectId", options.projectId);
  return (await request<{ data: ActivityItem[] }>(`/api/activity?${query}`)).data;
}
