import type { InquiryStatus, ListingStatus } from "@/lib/domain/types";
import { cn } from "@/lib/cn";

type Tone = "quiet" | "attention" | "positive" | "closed" | "accent";

const TONE: Record<Tone, { shell: string; dot: string }> = {
  quiet: { shell: "bg-ink/[0.05] text-ink-soft ring-ink/10", dot: "bg-ink-muted" },
  attention: { shell: "bg-sun/40 text-ink ring-sun", dot: "bg-ink" },
  positive: { shell: "bg-positive/10 text-positive ring-positive/25", dot: "bg-positive" },
  closed: { shell: "bg-ink text-paper ring-ink", dot: "bg-accent" },
  accent: { shell: "bg-accent text-ink ring-accent", dot: "bg-ink" },
};

type Spec = { label: string; tone: Tone };

const PILLS = {
  listing: {
    draft: { label: "Draft", tone: "quiet" },
    pending: { label: "In review", tone: "attention" },
    published: { label: "Published", tone: "positive" },
    sold: { label: "Sold", tone: "closed" },
    archived: { label: "Archived", tone: "quiet" },
  } satisfies Record<ListingStatus, Spec>,
  inquiry: {
    new: { label: "New", tone: "accent" },
    contacted: { label: "Contacted", tone: "positive" },
    closed: { label: "Closed", tone: "quiet" },
  } satisfies Record<InquiryStatus, Spec>,
};

type Pills = typeof PILLS;
type Kind = keyof Pills;

export type StatusPillProps = {
  [K in Kind]: { kind: K; status: keyof Pills[K]; className?: string };
}[Kind];

function specFor(props: StatusPillProps): Spec {
  const table: Record<string, Spec> = PILLS[props.kind];
  return table[props.status];
}

export function StatusPill(props: StatusPillProps) {
  const { label, tone } = specFor(props);
  const { className } = props;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-[0.25rem] px-2 py-0.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.06em] ring-1 ring-inset",
        TONE[tone].shell,
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-[1px]", TONE[tone].dot)} />
      {label}
    </span>
  );
}
