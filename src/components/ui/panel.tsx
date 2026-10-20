import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type PanelTone = "paper" | "night";

const TONE: Record<PanelTone, { shell: string; core: string }> = {
  paper: {
    shell: "bg-ink/[0.035] ring-ink/[0.06] shadow-float",
    core: "bg-paper-raised text-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.8)]",
  },
  night: {
    shell: "bg-white/[0.04] ring-white/[0.08] shadow-float",
    core: "bg-night-raised text-on-night shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]",
  },
};

/**
 * The double bezel: an outer tray and an inner plate with a concentric radius.
 * For UI surfaces (filters, forms, dashboard modules, dialogs). Never wrap
 * listing photography in it; photos stay cinematic and unboxed.
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
    <Tag className={cn("rounded-panel p-1.5 ring-1", TONE[tone].shell, className)}>
      <div className={cn("rounded-[calc(var(--radius-panel)-0.375rem)] p-6 md:p-8", TONE[tone].core, coreClassName)}>
        {children}
      </div>
    </Tag>
  );
}
