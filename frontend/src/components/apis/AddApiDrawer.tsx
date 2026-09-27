import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import type { NewApiInput } from "../../types/api";
import { Button } from "../common/Button";
import Drawer from "../common/Drawer";
import { Field, Input, Select, Switch, Textarea } from "../common/Form";

interface AddApiDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: NewApiInput) => void;
}

export default function AddApiDrawer({ open, onClose, onSubmit }: AddApiDrawerProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");

  function addTag() {
    const tag = tagDraft.trim().toLowerCase();
    if (tag && !tags.includes(tag)) setTags([...tags, tag]);
    setTagDraft("");
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    onSubmit({
      name: String(form.get("name")).trim(),
      baseUrl: String(form.get("baseUrl")).trim(),
      description: String(form.get("description")).trim(),
      tags,
      checkIntervalSeconds: Number(form.get("checkInterval")),
      timeoutSeconds: Number(form.get("timeout")),
      uptimeMonitoring: form.has("uptimeMonitoring"),
      performanceMonitoring: form.has("performanceMonitoring"),
      errorTracking: form.has("errorTracking"),
    });
    e.currentTarget.reset();
  }

  function handleReset() {
    setTags([]);
    setTagDraft("");
    onClose();
  }

  return (
    <Drawer open={open} onClose={onClose} title="Add New API" description="Enter the details of the API you want to monitor.">
      <form onSubmit={handleSubmit} onReset={handleReset} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain p-6">
          <Field label="API Name" htmlFor="api-name" hint="A short name to identify this API." required>
            <Input id="api-name" name="name" placeholder="My E-Commerce API" maxLength={60} required />
          </Field>

          <Field label="Base URL" htmlFor="api-url" hint="The root URL of your API, e.g. https://api.example.com" required>
            <Input id="api-url" name="baseUrl" type="url" placeholder="https://api.example.com" pattern="https?://.+" required className="font-mono" />
          </Field>

          <Field label="Description" htmlFor="api-description" optional>
            <Textarea id="api-description" name="description" placeholder="What does this API do?" maxLength={280} />
          </Field>

          <Field label="Tags" htmlFor="api-tags" optional>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface-3 pr-1.5 pl-2.5 text-xs text-neutral-200">
                  {tag}
                  <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} aria-label={`Remove tag ${tag}`} className="rounded text-neutral-500 hover:text-neutral-100">
                    <X size={13} />
                  </button>
                </span>
              ))}
              <div className="flex min-w-40 flex-1 gap-2">
                <Input id="api-tags" value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} onKeyDown={handleTagKeyDown} placeholder="production" maxLength={24} />
                <Button variant="secondary" size="icon" onClick={addTag} aria-label="Add tag">
                  <Plus size={15} />
                </Button>
              </div>
            </div>
          </Field>

          <div className="space-y-4 border-t border-line pt-5">
            <h3 className="font-medium text-neutral-100">Monitoring Settings</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Check Interval" htmlFor="api-interval">
                <Select id="api-interval" name="checkInterval" defaultValue="60">
                  <option value="30">30 seconds</option>
                  <option value="60">1 minute</option>
                  <option value="300">5 minutes</option>
                  <option value="900">15 minutes</option>
                </Select>
              </Field>
              <Field label="Timeout" htmlFor="api-timeout">
                <Select id="api-timeout" name="timeout" defaultValue="10">
                  <option value="5">5 seconds</option>
                  <option value="10">10 seconds</option>
                  <option value="30">30 seconds</option>
                </Select>
              </Field>
            </div>
            <div className="space-y-3 pt-1">
              <Switch name="uptimeMonitoring" label="Enable Uptime Monitoring" defaultChecked />
              <Switch name="performanceMonitoring" label="Enable Performance Monitoring" defaultChecked />
              <Switch name="errorTracking" label="Enable Error Tracking" defaultChecked />
            </div>
          </div>
        </div>

        <footer className="grid grid-cols-2 gap-3 border-t border-line p-6">
          <Button type="reset" variant="secondary">
            Cancel
          </Button>
          <Button type="submit">Add API</Button>
        </footer>
      </form>
    </Drawer>
  );
}
