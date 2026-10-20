import type { Metadata } from "next";

import { firstName } from "@/components/dashboard/copy";
import { InquiryAdvance } from "@/components/dashboard/inquiry-advance";
import { InquiryList } from "@/components/dashboard/inquiry-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { listAgentInquiries } from "@/lib/data/agent";
import { requireRole } from "@/lib/data/viewer";

export const metadata: Metadata = { title: "Inquiries" };

export default async function AgentInquiriesPage() {
  const member = await requireRole("agent");
  const inquiries = await listAgentInquiries();

  return (
    <>
      <PageHeader
        eyebrow={firstName(member.fullName)}
        title="Inquiries"
        lede="Messages about your listings. Move each one from new, to contacted, to closed."
      />
      <InquiryList
        inquiries={inquiries}
        action={(inquiry) => <InquiryAdvance inquiry={inquiry} />}
        empty={
          <EmptyState icon="inquiries" title="No messages yet">
            When a buyer writes about one of your listings, it arrives here.
          </EmptyState>
        }
      />
    </>
  );
}
