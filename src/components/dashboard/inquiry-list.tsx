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
    <ul className="flex flex-col">
      {inquiries.map((inquiry) => (
        <li key={inquiry.id} className="border-t border-ink/10 py-8 first:border-t-0 first:pt-0">
          <article className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:gap-10">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <StatusPill kind="inquiry" status={inquiry.status} />
                <time dateTime={inquiry.createdAt} className="text-small text-ink-muted">
                  {formatRelativeDate(inquiry.createdAt)}
                </time>
              </div>
              <h2 className="mt-4 font-display text-heading">
                <Link href={`/properties/${inquiry.propertySlug}`} className="underline decoration-ink/15 underline-offset-4">
                  {inquiry.propertyTitle}
                </Link>
              </h2>
              <p className="mt-4 max-w-[62ch] text-body text-ink-soft">{inquiry.message}</p>
              {inquiry.preferredViewingDate ? (
                <p className="mt-3 text-small text-ink-muted">Viewing {inquiry.preferredViewingDate}</p>
              ) : null}
            </div>
            <div className="flex flex-col items-start gap-2 text-small md:items-end md:pt-1">
              <p className="text-ink">{inquiry.name}</p>
              <a className="text-accent-ink underline decoration-accent-ink/30 underline-offset-4" href={`mailto:${inquiry.email}`}>
                {inquiry.email}
              </a>
              {inquiry.phone ? (
                <a className="text-ink-soft underline decoration-ink/20 underline-offset-4" href={`tel:${inquiry.phone.replace(/\s/g, "")}`}>
                  {inquiry.phone}
                </a>
              ) : null}
              {action ? action(inquiry) : null}
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
