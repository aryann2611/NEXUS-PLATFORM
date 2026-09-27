import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

// Native <dialog>: focus containment, Escape-to-close and an inert page come from the browser.
export default function Drawer({ open, onClose, title, description, children }: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector("input")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="drawer-title"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="drawer m-0 ml-auto h-dvh max-h-none w-full max-w-md border-l border-line bg-surface p-0 text-neutral-100"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-line p-6">
          <div>
            <h2 id="drawer-title" className="text-xl font-semibold tracking-tight">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </Button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
