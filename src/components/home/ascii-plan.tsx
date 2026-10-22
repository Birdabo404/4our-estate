import { cn } from "@/lib/cn";

const PLAN = [
  "┌───────────────┬────────────┬────────────┐",
  "│               │            │            │",
  "│   LIVING      │  KITCHEN   │   BED 01   │",
  "│   6.2 × 4.8   │ 3.6 × 4.0  │ 4.0 × 3.6  │",
  "│               ├────  ──────┤            │",
  "│                            ├─────  ─────┤",
  "├──────  ──┐     DINING      │            │",
  "│  T&B     │   4.2 × 3.0     │   BED 02   │",
  "│ 2.0 × 2.4│                 │ 3.6 × 3.4  │",
  "├──────────┴───────   ───────┴────────────┤",
  "│ ░░░░░░░░░░░░░░ LANAI ░░░░░░░░░░░░░░░░░░ │",
  "│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │",
  "└─────────────────────────────────────────┘",
  "    ≈≈≈≈≈≈≈≈≈≈≈≈≈≈ POOL ≈≈≈≈≈≈≈≈≈≈≈≈≈≈",
] as const;

const TOKEN = /(BED \d\d|T&B|[A-Z]{4,}|\d\.\d × \d\.\d|░+|≈+)/;

function tone(token: string): string {
  if (token.startsWith("░")) return "text-accent/45";
  if (token.startsWith("≈")) return "text-sky/70";
  if (/\d/.test(token) && token.includes("×")) return "text-accent";
  if (/[A-Z]/.test(token)) return "text-on-night";
  return "text-on-night-muted/55";
}

/**
 * A two-bedroom house drawn in box characters, the way a plan reads in a
 * terminal. Decorative: the figure is hidden from assistive tech and the
 * caption carries the meaning.
 */
export function AsciiPlan({ className }: { className?: string }) {
  return (
    <figure className={cn("flex flex-col gap-4", className)}>
      <pre aria-hidden className="overflow-x-auto font-mono text-[clamp(0.5rem,0.25rem+0.75vw,0.875rem)] leading-[1.35]">
        {PLAN.map((line, i) => (
          <span key={i} className="block">
            {line.split(TOKEN).map((part, j) =>
              part ? (
                <span key={j} className={tone(part)}>
                  {part}
                </span>
              ) : null,
            )}
          </span>
        ))}
      </pre>
      <figcaption className="flex items-center gap-2 font-mono text-[0.75rem] text-on-night-muted">
        <span className="text-accent">$</span> 4our plan --unit casa-02 --scale m
        <span aria-hidden className="inline-block h-[1.1em] w-[0.55em] animate-blink bg-accent" />
      </figcaption>
    </figure>
  );
}
