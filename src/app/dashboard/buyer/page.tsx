import type { Metadata } from "next";

import { PageHeader } from "@/components/dashboard/page-header";
import { SavedResidences } from "@/components/dashboard/saved-residences";
import { firstName, greeting } from "@/components/dashboard/copy";
import { listFavorites } from "@/lib/data/buyer";
import { requireRole } from "@/lib/data/viewer";

export const metadata: Metadata = { title: "Saved residences" };

export default async function BuyerHomePage() {
  const member = await requireRole("buyer");
  const favorites = await listFavorites();

  return (
    <>
      <PageHeader
        eyebrow="Buyer"
        title={
          <>
            {greeting()}, <em>{firstName(member.fullName)}</em>
          </>
        }
        lede="Residences you kept. Nothing else is waiting here."
      />
      <SavedResidences properties={favorites} />
    </>
  );
}
