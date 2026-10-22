import { redirect } from "next/navigation";

import { dashboardPath } from "@/lib/auth/paths";
import { requireRole } from "@/lib/data/viewer";

export default async function DashboardIndex() {
  const member = await requireRole("buyer", "agent", "admin");
  redirect(dashboardPath(member.role));
}
