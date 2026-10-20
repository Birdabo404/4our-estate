import type { Metadata } from "next";

import { firstName } from "@/components/dashboard/copy";
import { InquiryList } from "@/components/dashboard/inquiry-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { listMyInquiries } from "@/lib/data/buyer";
import { requireRole } from "@/lib/data/viewer";

export const metadata: Metadata = { title: "Inquiries" };

export default async function BuyerInquiriesPage() {
  const member = await requireRole("buyer");
  const inquiries = await listMyInquiries();

  return (
    <>
      <PageHeader
        eyebrow={firstName(member.fullName)}
        title="Inquiries"
        lede="Notes you have sent about a residence, and where each one stands."
      />
      <InquiryList
        inquiries={inquiries}
        empty={
          <EmptyState
            icon="inquiries"
            title="No inquiries yet"
            action={<ButtonLink href="/properties">Browse residences</ButtonLink>}
          >
            When you write to an agent, the conversation is kept here.
          </EmptyState>
        }
      />
    </>
  );
}
