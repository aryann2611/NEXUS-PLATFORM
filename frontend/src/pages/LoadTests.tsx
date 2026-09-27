import { Zap } from "lucide-react";
import { Button } from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import { Field, Input, Select } from "../components/common/Form";
import PageHeader from "../components/common/PageHeader";

const resultMetrics = ["Requests", "Requests/sec", "Avg Latency", "p95", "p99", "Error Rate"];

export default function LoadTests() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Test" title="Load Tests" description="See how an endpoint behaves under concurrent traffic." />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="New Test" description="Configure a load-test run.">
          <form className="space-y-4 border-t border-line p-5">
            <Field label="Target URL" htmlFor="lt-url" required>
              <Input id="lt-url" name="targetUrl" type="url" placeholder="https://api.example.com/users" required className="font-mono" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Virtual Users" htmlFor="lt-vus">
                <Input id="lt-vus" name="virtualUsers" type="number" min={1} max={1000} defaultValue={50} className="font-mono" />
              </Field>
              <Field label="Duration" htmlFor="lt-duration">
                <Select id="lt-duration" name="durationSeconds" defaultValue="60">
                  <option value="30">30 seconds</option>
                  <option value="60">1 minute</option>
                  <option value="300">5 minutes</option>
                  <option value="600">10 minutes</option>
                </Select>
              </Field>
            </div>
            <Button type="submit" className="w-full" disabled>
              <Zap size={16} /> Start Test
            </Button>
            <p className="text-xs text-neutral-500">The test runner isn't connected yet — k6 execution arrives in a later phase.</p>
          </form>
        </Card>

        <Card title="Results" description="Metrics from the latest run." className="xl:col-span-2">
          <dl className="grid grid-cols-2 gap-px border-y border-line bg-line sm:grid-cols-3">
            {resultMetrics.map((label) => (
              <div key={label} className="bg-surface px-5 py-4">
                <dt className="text-xs text-neutral-500">{label}</dt>
                <dd className="mt-1 font-mono text-xl text-neutral-600">—</dd>
              </div>
            ))}
          </dl>
          <EmptyState icon={Zap} title="No test runs yet" description="Results will appear here once a load test has completed." />
        </Card>
      </div>
    </div>
  );
}
