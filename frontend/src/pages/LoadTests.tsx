import { useState, type FormEvent } from "react";
import { CircleAlert, Loader, Zap } from "lucide-react";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import { Field, Input, Select } from "../components/common/Form";
import PageHeader from "../components/common/PageHeader";
import { useLoadTest } from "../hooks/useLoadTest";
import { compactNumber } from "../lib/format";
import { API_URL } from "../services/api";
import type { LoadTestSnapshot } from "../types/loadTest";

function metricsFrom(snapshot: LoadTestSnapshot | null): { label: string; value: string }[] {
  const dash = (value: string) => (snapshot ? value : "—");
  return [
    { label: "Requests", value: dash(compactNumber(snapshot?.requests ?? 0)) },
    { label: "Requests/sec", value: dash(String(Math.round(snapshot?.requestsPerSec ?? 0))) },
    { label: "Avg Latency", value: dash(`${Math.round(snapshot?.avgLatencyMs ?? 0)}ms`) },
    { label: "p95", value: dash(`${Math.round(snapshot?.p95Ms ?? 0)}ms`) },
    { label: "p99", value: dash(`${Math.round(snapshot?.p99Ms ?? 0)}ms`) },
    { label: "Error Rate", value: dash(`${(snapshot?.errorRatePercent ?? 0).toFixed(2)}%`) },
  ];
}

export default function LoadTests() {
  const { state, snapshot, error, start, cancel } = useLoadTest();
  const [url, setUrl] = useState(`${API_URL}/api/health`);
  const running = state === "running";

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    start({
      url: url.trim(),
      vus: Number(form.get("virtualUsers")),
      durationSeconds: Number(form.get("durationSeconds")),
    });
  }

  const metrics = metricsFrom(snapshot);
  const progress = snapshot ? Math.min(100, (snapshot.elapsedMs / snapshot.durationMs) * 100) : running ? 3 : 0;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Test" title="Load Tests" description="Drive real traffic at an endpoint with k6 and watch it respond live." />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="New Test" description="Configure a load-test run.">
          <form onSubmit={handleSubmit} className="space-y-4 border-t border-line p-5">
            <Field label="Target URL" htmlFor="lt-url" hint="Only load-test services you own or have permission to test." required>
              <Input id="lt-url" value={url} onChange={(e) => setUrl(e.target.value)} type="url" pattern="https?://.+" placeholder="https://api.example.com/users" required disabled={running} className="font-mono" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Virtual Users" htmlFor="lt-vus">
                <Input id="lt-vus" name="virtualUsers" type="number" min={1} max={50} defaultValue={10} disabled={running} className="font-mono" />
              </Field>
              <Field label="Duration" htmlFor="lt-duration">
                <Select id="lt-duration" name="durationSeconds" defaultValue="30" disabled={running}>
                  <option value="10">10 seconds</option>
                  <option value="30">30 seconds</option>
                  <option value="60">60 seconds</option>
                </Select>
              </Field>
            </div>
            {running ? (
              <Button type="button" variant="secondary" className="w-full" onClick={cancel}>
                <Loader size={16} className="animate-spin" /> Running… Stop
              </Button>
            ) : (
              <Button type="submit" className="w-full">
                <Zap size={16} /> Start Test
              </Button>
            )}
            {state === "error" && (
              <p role="alert" className="flex items-center gap-1.5 text-sm text-red-400">
                <CircleAlert size={14} /> {error}
              </p>
            )}
          </form>
        </Card>

        <Card
          title="Results"
          description={running ? "Live metrics — test in progress." : "Metrics from the latest run."}
          className="xl:col-span-2"
          actions={snapshot && <Badge tone={running ? "neutral" : "healthy"} dot>{running ? "Running" : "Complete"}</Badge>}
        >
          <div className="h-0.5 w-full bg-line" role="presentation">
            <div className="h-full bg-neutral-300 transition-[width] duration-500 ease-linear" style={{ width: `${progress}%` }} />
          </div>

          <dl className="grid grid-cols-2 gap-px border-b border-line bg-line sm:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="bg-surface px-5 py-4">
                <dt className="text-xs text-neutral-500">{metric.label}</dt>
                <dd className={`mt-1 font-mono text-xl ${snapshot ? "text-neutral-50" : "text-neutral-600"}`}>{metric.value}</dd>
              </div>
            ))}
          </dl>

          {!snapshot && <EmptyState icon={Zap} title="No test runs yet" description="Configure a target and start a test to see live results here." />}
        </Card>
      </div>
    </div>
  );
}
