import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/shell";
import { getViewer } from "@/lib/data/viewer";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  if (viewer.kind === "guest") redirect("/login?next=/dashboard");

  return (
    <DashboardShell
      account={{
        fullName: viewer.fullName,
        email: viewer.email,
        role: viewer.role,
      }}
    >
      {children}
    </DashboardShell>
  );
}
