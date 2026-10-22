import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type EyebrowTone = "paper" | "night" | "image" | "accent";

const TONE: Record<EyebrowTone, { shell: string; dot: string }> = {
  paper: { shell: "bg-ink/[0.06] text-ink-soft", dot: "bg-accent" },
  night: { shell: "bg-on-night/10 text-on-night", dot: "bg-accent" },
  image: { shell: "bg-white text-ink", dot: "bg-accent" },
  accent: { shell: "bg-accent text-ink", dot: "bg-ink" },
};

/** A mono uppercase tag, the label printed on a site plan. */
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
        "inline-flex items-center gap-2 rounded-[0.25rem] px-2.5 py-1 text-micro font-medium uppercase",
        TONE[tone].shell,
        className,
      )}
    >
      {dot && <span aria-hidden className={cn("size-1.5 rounded-[1px]", TONE[tone].dot)} />}
      {children}
    </span>
  );
}
