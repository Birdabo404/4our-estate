import type { Metadata } from "next";

import { firstName } from "@/components/dashboard/copy";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { getOwnProfile } from "@/lib/data/profile";
import { requireRole } from "@/lib/data/viewer";

export const metadata: Metadata = { title: "Profile" };

export default async function BuyerProfilePage() {
  const member = await requireRole("buyer");
  const profile = await getOwnProfile();

  return (
    <>
      <PageHeader
        eyebrow={firstName(member.fullName)}
        title="Profile"
        lede="The name and number agents see when you write."
      />
      <ProfileForm profile={profile} />
    </>
  );
}
