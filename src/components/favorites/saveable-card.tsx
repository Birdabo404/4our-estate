import { PropertyCard, type PropertyCardVariant } from "@/components/property/property-card";
import { cn } from "@/lib/cn";
import type { PropertySummary } from "@/lib/domain/types";
import { FavoriteButton } from "./favorite-button";

/**
 * PropertyCard's `action` slot renders inside the image's isolated stacking
 * context, beneath the title link's stretched hit area, so it cannot be
 * clicked. The toggle sits over the card from outside instead. The feature
 * offset mirrors that variant's photo, which spans 7 of 12 columns.
 */
const PLACEMENT: Record<Exclude<PropertyCardVariant, "compact">, string> = {
  grid: "right-3",
  feature: "right-3 md:right-[calc(41.6667%+0.75rem)]",
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
    <div className={cn("relative h-full", className)}>
      <PropertyCard property={property} variant={variant} priority={priority} />
      <div className={cn("absolute top-3 z-10", PLACEMENT[variant])}>
        <FavoriteButton propertyId={property.id} title={property.title} />
      </div>
    </div>
  );
}
