import Link from "next/link";
import type { ReactNode } from "react";

import type { Inquiry } from "@/lib/domain/types";
import { formatRelativeDate } from "@/lib/format";
import { StatusPill } from "@/components/ui/status-pill";

export function InquiryList({
  inquiries,
  empty,
  action,
}: {
  inquiries: Inquiry[];
  empty: ReactNode;
  action?: (inquiry: Inquiry) => ReactNode;
}) {
  if (inquiries.length === 0) return empty;

  return (
    <ul className="flex flex-col gap-3">
      {inquiries.map((inquiry) => (
        <li key={inquiry.id} className="rounded-panel bg-paper-raised p-4 ring-1 ring-ink/10 md:p-5">
          <article className="grid gap-4 md:grid-cols-[minmax(0,1fr)_16rem] md:gap-8">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <StatusPill kind="inquiry" status={inquiry.status} />
                <time dateTime={inquiry.createdAt} className="font-mono text-[0.75rem] text-ink-muted">
                  {formatRelativeDate(inquiry.createdAt)}
                </time>
              </div>
              <h2 className="mt-3 font-display text-title font-semibold">
                <Link href={`/properties/${inquiry.propertySlug}`} className="underline decoration-ink/15 underline-offset-4 transition-colors duration-300 ease-settle hover:decoration-ink">
                  {inquiry.propertyTitle}
                </Link>
              </h2>
              <p className="mt-3 max-w-[64ch] border-l-2 border-accent pl-3 text-body text-ink-soft">{inquiry.message}</p>
              {inquiry.preferredViewingDate ? (
                <p className="mt-3 inline-flex rounded-[0.25rem] bg-sky px-2 py-0.5 font-mono text-[0.6875rem] uppercase text-ink">
                  Viewing {inquiry.preferredViewingDate}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col items-start gap-1.5 rounded-md bg-paper-sunken/60 p-3 text-small">
              <p className="text-micro uppercase text-ink-muted">From</p>
              <p className="font-semibold text-ink">{inquiry.name}</p>
              <a className="text-accent-ink underline decoration-accent-ink/30 underline-offset-4" href={`mailto:${inquiry.email}`}>
                {inquiry.email}
              </a>
              {inquiry.phone ? (
                <a className="text-ink-soft underline decoration-ink/20 underline-offset-4" href={`tel:${inquiry.phone.replace(/\s/g, "")}`}>
                  {inquiry.phone}
                </a>
              ) : null}
              {action ? <div className="mt-2">{action(inquiry)}</div> : null}
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
