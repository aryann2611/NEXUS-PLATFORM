import type { ComponentProps } from "react";
import { Link } from "react-router-dom";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "icon";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary: "bg-neutral-100 text-neutral-950 shadow-[0_8px_20px_rgb(0_0_0/0.28)] hover:-translate-y-px hover:bg-white hover:shadow-[0_12px_26px_rgb(0_0_0/0.38)]",
  secondary: "border border-line bg-surface-2 text-neutral-200 hover:-translate-y-px hover:border-neutral-400/60 hover:bg-surface-3 hover:text-neutral-50",
  ghost: "text-neutral-400 hover:bg-white/5 hover:text-neutral-100",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  icon: "size-9",
};

interface StyleProps {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "primary", size = "md", className = "", type = "button", ...props }: ComponentProps<"button"> & StyleProps) {
  return <button type={type} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}

export function ButtonLink({ variant = "secondary", size = "md", className = "", ...props }: ComponentProps<typeof Link> & StyleProps) {
  return <Link className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}
