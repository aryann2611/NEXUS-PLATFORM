import type { ComponentProps, ReactNode } from "react";

const control =
  "w-full rounded-xl border border-line bg-surface-2 px-3 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600 hover:border-line-strong focus:border-neutral-300/70 focus:ring-4 focus:ring-white/10 user-invalid:border-red-500/60";

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  required?: boolean;
  optional?: boolean;
  children: ReactNode;
}

export function Field({ label, htmlFor, hint, required, optional, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-neutral-200">
        {label}
        {required && <span className="text-red-400"> *</span>}
        {optional && <span className="font-normal text-neutral-500"> (Optional)</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input className={`${control} h-9 ${className}`} {...props} />;
}

export function Textarea(props: ComponentProps<"textarea">) {
  return <textarea className={`${control} min-h-20 resize-y py-2`} {...props} />;
}

export function Select(props: ComponentProps<"select">) {
  return <select className={`${control} h-9`} {...props} />;
}

export function Switch({ label, ...props }: { label: string } & ComponentProps<"input">) {
  return (
    <label className="relative flex cursor-pointer items-center gap-3">
      <input type="checkbox" role="switch" className="peer sr-only" {...props} />
      <span
        aria-hidden
        className="relative h-5 w-9 shrink-0 rounded-full bg-neutral-700 transition-colors after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-green-500 peer-checked:after:translate-x-4 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-white/40"
      />
      <span className="text-sm text-neutral-300">{label}</span>
    </label>
  );
}
