import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type SectionSpace = "hero" | "default" | "tight" | "flush";
export type SectionTone = "paper" | "raised" | "night";

const SPACE: Record<SectionSpace, string> = {
  hero: "pt-32 pb-24 md:pt-44 md:pb-36",
  default: "py-24 md:py-36 lg:py-44",
  tight: "py-16 md:py-24",
  flush: "",
};

const TONE: Record<SectionTone, string> = {
  paper: "bg-paper text-ink",
  raised: "bg-paper-raised text-ink",
  night: "bg-night text-on-night",
};

export function Section({
  id,
  space = "default",
  tone = "paper",
  className,
  children,
  "aria-labelledby": labelledBy,
}: {
  id?: string;
  space?: SectionSpace;
  tone?: SectionTone;
  className?: string;
  children: ReactNode;
  "aria-labelledby"?: string;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("relative", SPACE[space], TONE[tone], className)}>
      {children}
    </section>
  );
}
