import { PropertyCard, type PropertyCardVariant } from "@/components/property/property-card";
import { cn } from "@/lib/cn";
import type { PropertySummary } from "@/lib/domain/types";
import { FavoriteButton } from "./favorite-button";

/**
 * PropertyCard's `action` slot renders inside the image's isolated stacking
 * context, beneath the title link's stretched hit area, so it cannot be
 * clicked. The toggle sits over the card from outside instead. The feature
 * offset mirrors that variant's 8 of 12 columns with a 2.5rem gutter.
 */
const PLACEMENT: Record<Exclude<PropertyCardVariant, "compact">, string> = {
  grid: "right-4",
  feature: "right-4 md:right-[calc((100%-27.5rem)/3+11rem)]",
};

export function SaveableCard({
  property,
  variant = "grid",
  priority,
  className,
}: {
  property: PropertySummary;
  variant?: Exclude<PropertyCardVariant, "compact">;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <PropertyCard property={property} variant={variant} priority={priority} />
      <div className={cn("absolute top-4 z-10", PLACEMENT[variant])}>
        <FavoriteButton propertyId={property.id} title={property.title} />
      </div>
    </div>
  );
}
