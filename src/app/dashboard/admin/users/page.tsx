import type { Metadata } from "next";

import { firstName } from "@/components/dashboard/copy";
import { PageHeader } from "@/components/dashboard/page-header";
import { UserDirectory } from "@/components/dashboard/user-directory";
import { listUsers } from "@/lib/data/admin";
import { requireRole } from "@/lib/data/viewer";

export const metadata: Metadata = { title: "People" };

export default async function AdminUsersPage() {
  const member = await requireRole("admin");
  const users = await listUsers();

  return (
    <>
      <PageHeader
        eyebrow={firstName(member.fullName)}
        title="People"
        lede="Buyers, agents, and the few who keep the house."
      />
      <UserDirectory users={users} />
    </>
  );
}
