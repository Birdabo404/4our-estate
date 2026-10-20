import type { Metadata } from "next";

import { firstName, greeting } from "@/components/dashboard/copy";
import { PageHeader } from "@/components/dashboard/page-header";
import { CountUp } from "@/components/motion/count-up";
import { ButtonLink } from "@/components/ui/button";
import { getAdminStats } from "@/lib/data/admin";
import { requireRole } from "@/lib/data/viewer";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminHomePage() {
  const member = await requireRole("admin");
  const stats = await getAdminStats();

  const figures = [
    { label: "Members", value: stats.userCount },
    { label: "Listings", value: stats.listingCount },
    { label: "In review", value: stats.pendingCount },
    { label: "Published", value: stats.publishedCount },
    { label: "Inquiries", value: stats.inquiryCount },
    { label: "New inquiries", value: stats.newInquiryCount },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title={
          <>
            {greeting()}, <em>{firstName(member.fullName)}</em>
          </>
        }
        lede="The house, counted once. Review is the only queue that asks for a decision."
        action={
          stats.pendingCount > 0 ? (
            <ButtonLink href="/dashboard/admin/moderation">Review queue</ButtonLink>
          ) : undefined
        }
      />
      <dl className="grid grid-cols-2 gap-x-8 gap-y-14 md:grid-cols-3">
        {figures.map((figure) => (
          <div key={figure.label}>
            <dt className="text-micro font-medium uppercase text-ink-muted">{figure.label}</dt>
            <dd className="mt-3 font-display text-display-3">
              <CountUp value={figure.value} />
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}
