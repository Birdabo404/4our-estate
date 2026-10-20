import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type EyebrowTone = "paper" | "night" | "image";

const TONE: Record<EyebrowTone, { shell: string; dot: string }> = {
  paper: { shell: "text-ink-muted ring-ink/12", dot: "bg-accent" },
  night: { shell: "text-on-night-muted ring-on-night/15", dot: "bg-accent-soft" },
  image: { shell: "text-white/90 ring-white/30 bg-night/20", dot: "bg-white" },
};

export function Eyebrow({
  children,
  tone = "paper",
  dot = true,
  className,
}: {
  children: ReactNode;
  tone?: EyebrowTone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full px-3.5 py-1.5 text-micro font-medium uppercase ring-1 ring-inset",
        TONE[tone].shell,
        className,
      )}
    >
      {dot && <span aria-hidden className={cn("size-1 rounded-full", TONE[tone].dot)} />}
      {children}
    </span>
  );
}
