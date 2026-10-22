import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type PanelTone = "paper" | "night";

const TONE: Record<PanelTone, string> = {
  paper: "bg-paper-raised text-ink ring-ink/10 shadow-lift",
  night: "bg-night-raised text-on-night ring-white/10",
};

/**
 * A white sheet with a hairline edge, for forms, dialogs, and dashboard
 * modules. Listing photography never goes inside one.
 */
export function Panel({
  as: Tag = "div",
  tone = "paper",
  className,
  coreClassName,
  children,
}: {
  as?: ElementType;
  tone?: PanelTone;
  className?: string;
  coreClassName?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={cn("rounded-panel ring-1", TONE[tone], className)}>
      <div className={cn("p-6 md:p-8", coreClassName)}>{children}</div>
    </Tag>
  );
}
