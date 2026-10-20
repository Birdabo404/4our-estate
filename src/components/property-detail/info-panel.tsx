import { FavoriteButton } from "@/components/favorites/favorite-button";
import { InquiryForm } from "@/components/inquiry/inquiry-form";
import { LISTING_TYPE_LABEL, listingsHref } from "@/components/listings/filters";
import { Price } from "@/components/property/price";
import { ButtonLink } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/cn";
import type { PropertyDetail } from "@/lib/domain/types";
import { formatPhp } from "@/lib/format";
import { AgentCard, firstName } from "./sections";

type Defaults = { name: string; email: string };

export function PriceSummary({ property, className }: { property: PropertyDetail; className?: string }) {
  const sold = property.status === "sold";
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex min-h-11 items-center justify-between gap-4">
        <p className="text-micro uppercase text-ink-muted">{sold ? "No longer available" : LISTING_TYPE_LABEL[property.listingType]}</p>
        {!sold && <FavoriteButton propertyId={property.id} title={property.title} tone="paper" className="shrink-0" />}
      </div>
      {sold ? (
        <p className="font-display text-[clamp(2.5rem,1.6rem+2.6vw,4rem)] italic leading-none [--opsz:24]">Sold</p>
      ) : (
        <Price amount={property.pricePhp} listingType={property.listingType} size="xl" className="text-[clamp(2.5rem,1.8rem+1.6vw,3.25rem)]" />
      )}
    </div>
  );
}

export function SoldNote({ property }: { property: PropertyDetail }) {
  return (
    <div className="flex flex-col items-start gap-5">
      <p className="text-body text-ink-soft">
        This residence found its owner, last offered at <span className="tabular text-ink">{formatPhp(property.pricePhp)}</span>.{" "}
        {firstName(property.agent.fullName)} represents others like it in {property.city}.
      </p>
      <ButtonLink href={listingsHref({ city: property.city, sort: "newest", page: 1 })} variant="secondary" icon="arrow-right">
        Residences in {property.city}
      </ButtonLink>
    </div>
  );
}

export function InfoPanel({ property, defaults }: { property: PropertyDetail; defaults: Defaults }) {
  const sold = property.status === "sold";
  return (
    <Panel coreClassName="flex flex-col gap-6 md:p-7">
      <PriceSummary property={property} />
      <div className="h-px bg-ink/10" />
      <AgentCard agent={property.agent} />
      <div className="h-px bg-ink/10" />
      {sold ? (
        <SoldNote property={property} />
      ) : (
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-title">Arrange a private viewing</h2>
          <InquiryForm
            propertyId={property.id}
            propertyTitle={property.title}
            agent={{ firstName: firstName(property.agent.fullName), phone: property.agent.phone }}
            defaults={defaults}
          />
        </div>
      )}
    </Panel>
  );
}
