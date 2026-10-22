import type { Icon } from "@phosphor-icons/react";
import { ArrowUpRight } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import type { ReactNode } from "react";

import { CountUp, type CountFormat } from "@/components/motion/count-up";
import { cn } from "@/lib/cn";

type StatTone = "paper" | "accent" | "night" | "sky";

const STAT_TONE: Record<StatTone, { root: string; label: string; hint: string; icon: string }> = {
  paper: { root: "bg-paper-raised text-ink ring-ink/10", label: "text-ink-muted", hint: "text-ink-soft", icon: "bg-ink/[0.06] text-ink" },
  accent: { root: "bg-accent text-ink ring-ink", label: "text-ink/75", hint: "text-ink/80", icon: "bg-ink text-accent" },
  night: { root: "bg-night text-on-night ring-white/10", label: "text-on-night-muted", hint: "text-on-night-muted", icon: "bg-white/10 text-accent" },
  sky: { root: "bg-sky text-ink ring-ink/10", label: "text-ink-muted", hint: "text-ink-soft", icon: "bg-paper-raised text-ink" },
};

export function StatCard({
  label,
  value,
  format = "integer",
  hint,
  icon: Glyph,
  tone = "paper",
  href,
  className,
}: {
  label: string;
  value: number;
  format?: CountFormat;
  hint?: ReactNode;
  icon?: Icon;
  tone?: StatTone;
  href?: string;
  className?: string;
}) {
  const t = STAT_TONE[tone];
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className={cn("text-micro uppercase", t.label)}>{label}</p>
        {Glyph ? (
          <span aria-hidden className={cn("grid size-8 shrink-0 place-items-center rounded-[0.3rem]", t.icon)}>
            <Glyph size={16} weight="bold" />
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <p className="condensed tabular font-display text-[clamp(2.75rem,2.1rem+1.6vw,3.75rem)] font-bold leading-[0.85] tracking-[-0.02em]">
          <CountUp value={value} format={format} seconds={1.4} />
        </p>
        {hint ? <p className={cn("text-[0.8125rem] leading-snug", t.hint)}>{hint}</p> : null}
      </div>
    </>
  );
  const root = cn(
    "flex min-h-[10.5rem] flex-col justify-between gap-5 rounded-panel p-4 ring-1 md:p-5",
    t.root,
    href && "transition-[box-shadow] duration-300 ease-settle hover:shadow-block hover:ring-ink",
    className,
  );
  return href ? (
    <Link href={href} className={root}>
      {body}
    </Link>
  ) : (
    <div className={root}>{body}</div>
  );
}

export function Card({
  title,
  kicker,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  kicker?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col rounded-panel bg-paper-raised ring-1 ring-ink/10", className)}>
      <header className="flex items-center justify-between gap-4 border-b border-ink/10 px-4 py-3 md:px-5">
        <div className="flex min-w-0 items-baseline gap-3">
          <h2 className="truncate font-display text-[1.0625rem] font-semibold tracking-[-0.01em]">{title}</h2>
          {kicker ? <span className="truncate font-mono text-[0.6875rem] text-ink-muted">{kicker}</span> : null}
        </div>
        {action}
      </header>
      <div className={cn("flex-1 p-4 md:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function CardLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex shrink-0 items-center gap-1.5 rounded-[0.25rem] px-1.5 py-1 font-mono text-[0.6875rem] uppercase text-ink-soft transition-colors duration-300 ease-settle hover:bg-ink hover:text-paper"
    >
      {children}
      <ArrowUpRight aria-hidden size={12} weight="bold" />
    </Link>
  );
}

export type Segment = { label: string; value: number; swatch: string };

/** One horizontal bar split by share, with a legend that doubles as the data table. */
export function StackedBar({ segments, label }: { segments: readonly Segment[]; label: string }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const summary = segments.map((s) => `${s.label} ${s.value}`).join(", ");
  return (
    <div className="flex flex-col gap-4">
      <div role="img" aria-label={`${label}: ${summary}`} className="flex h-11 gap-0.5 overflow-hidden rounded-md bg-paper-sunken p-0.5 ring-1 ring-ink/10">
        {total === 0 ? (
          <span className="bg-hatch flex-1 rounded-[0.3rem]" />
        ) : (
          segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <span key={s.label} className={cn("min-w-2 basis-0 rounded-[0.3rem]", s.swatch)} style={{ flexGrow: s.value }} />
            ))
        )}
      </div>
      <ul className="grid grid-cols-2 gap-x-6 sm:grid-cols-3">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3 border-b border-dashed border-ink/15 py-2 font-mono text-[0.75rem]">
            <span className="flex min-w-0 items-center gap-2 text-ink-soft">
              <span aria-hidden className={cn("size-2.5 shrink-0 rounded-[2px] ring-1 ring-ink/10", s.swatch)} />
              <span className="truncate">{s.label}</span>
            </span>
            <span className="tabular font-semibold text-ink">
              {s.value}
              <span className="ml-1.5 font-normal text-ink-muted">{total ? Math.round((s.value / total) * 100) : 0}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export type Bar = { key: string; label: string; value: number; title?: string };

/** Vertical bars on a dashed grid. The tallest bar is drawn in accent. */
export function BarChart({ bars, label, height = "h-48" }: { bars: readonly Bar[]; label: string; height?: string }) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  const top = bars.reduce<Bar | undefined>((best, b) => (b.value > (best?.value ?? 0) ? b : best), undefined);
  return (
    <figure className="flex flex-col gap-2">
      <div
        role="img"
        aria-label={`${label}: ${bars.map((b) => `${b.title ?? b.label} ${b.value}`).join(", ")}`}
        className={cn("relative flex items-end gap-2 border-b border-ink/25 px-1 sm:gap-3", height)}
      >
        {[25, 50, 75].map((line) => (
          <span key={line} aria-hidden className="absolute inset-x-0 border-t border-dashed border-ink/10" style={{ bottom: `${line}%` }} />
        ))}
        {bars.map((bar) => (
          <div key={bar.key} className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
            <span className="tabular font-mono text-[0.6875rem] font-semibold text-ink">{bar.value}</span>
            <span
              className={cn(
                "w-full max-w-14 rounded-t-[0.3rem] ring-1 ring-inset ring-ink/10",
                bar.value === 0 ? "bg-ink/10" : bar.key === top?.key ? "bg-accent" : "bg-sun",
              )}
              style={{ height: bar.value === 0 ? "2px" : `${(bar.value / max) * 80}%` }}
            />
          </div>
        ))}
      </div>
      <figcaption className="flex gap-2 px-1 sm:gap-3" aria-hidden>
        {bars.map((bar) => (
          <span key={bar.key} className="min-w-0 flex-1 truncate text-center font-mono text-[0.6875rem] text-ink-muted">
            {bar.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

/** A labelled horizontal meter row, for ranked lists. */
export function MeterRow({
  label,
  value,
  max,
  href,
  detail,
}: {
  label: string;
  value: number;
  max: number;
  href?: string;
  detail?: ReactNode;
}) {
  const inner = (
    <>
      <span className="flex items-baseline justify-between gap-4">
        <span className="truncate text-small font-semibold text-ink">{label}</span>
        <span className="tabular shrink-0 font-mono text-[0.75rem] text-ink">{value}</span>
      </span>
      <span aria-hidden className="block h-1.5 overflow-hidden rounded-[2px] bg-paper-sunken">
        <span className="block h-full rounded-[2px] bg-sky-deep" style={{ width: `${max ? Math.max(3, (value / max) * 100) : 0}%` }} />
      </span>
      {detail ? <span className="truncate font-mono text-[0.6875rem] text-ink-muted">{detail}</span> : null}
    </>
  );
  const cls = "flex flex-col gap-1.5 rounded-md p-2 -mx-2 transition-colors duration-300 ease-settle";
  return href ? (
    <Link href={href} className={cn(cls, "hover:bg-sky-soft")}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/** A thin table frame: mono column heads, dashed row rules, sky hover. */
export function DataTable({ head, children, className }: { head: readonly string[]; children: ReactNode; className?: string }) {
  return (
    <div className={cn("-mx-4 overflow-x-auto md:-mx-5", className)}>
      <table className="w-full min-w-[34rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-ink/10">
            {head.map((h, i) => (
              <th
                key={h || i}
                scope="col"
                className={cn(
                  "px-4 py-2 font-mono text-[0.6875rem] font-normal uppercase tracking-[0.06em] text-ink-muted first:pl-4 md:first:pl-5 last:pr-4 md:last:pr-5",
                  i === head.length - 1 && "text-right",
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr]:border-b [&>tr]:border-dashed [&>tr]:border-ink/10 [&>tr:last-child]:border-0 [&>tr]:transition-colors [&>tr:hover]:bg-sky-soft [&_td]:px-4 [&_td]:py-3 [&_td:first-child]:md:pl-5 [&_td:last-child]:text-right [&_td:last-child]:md:pr-5">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="bg-hatch rounded-md px-4 py-6 text-center font-mono text-[0.75rem] text-ink-muted ring-1 ring-inset ring-ink/10">{children}</p>
  );
}
