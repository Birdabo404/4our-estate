import type { ReactNode } from "react";

import { PendingLicense } from "@/components/dashboard/pending-license";
import { requireRole } from "@/lib/data/viewer";

export default async function AgentLayout({ children }: { children: ReactNode }) {
  await requireRole("agent");
  return (
    <>
      <PendingLicense />
      {children}
    </>
  );
}
