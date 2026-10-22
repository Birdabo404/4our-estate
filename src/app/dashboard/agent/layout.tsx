import type { ReactNode } from "react";

import { requireRole } from "@/lib/data/viewer";

export default async function AgentLayout({ children }: { children: ReactNode }) {
  await requireRole("agent");
  return children;
}
