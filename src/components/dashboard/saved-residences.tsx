"use client";

import { X } from "@phosphor-icons/react/ssr";
import { useState } from "react";

import { toggleFavorite } from "@/lib/actions/favorites";
import type { PropertySummary } from "@/lib/domain/types";
import { PropertyCard } from "@/components/property/property-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";

export function SavedResidences({ properties }: { properties: PropertySummary[] }) {
  const { toast } = useToast();
  const [hidden, setHidden] = useState<string[]>([]);
  const [undo, setUndo] = useState<PropertySummary | null>(null);
  const visible = properties.filter((property) => !hidden.includes(property.id));

  async function remove(property: PropertySummary) {
    setHidden((current) => [...current, property.id]);
    setUndo(property);
    const formData = new FormData();
    formData.set("propertyId", property.id);
    const result = await toggleFavorite(null, formData);
    if (!result.ok) {
      setHidden((current) => current.filter((id) => id !== property.id));
      setUndo((current) => (current?.id === property.id ? null : current));
      toast({ title: result.formError ?? "Could not update saved homes.", tone: "danger" });
    }
  }

  async function restore(property: PropertySummary) {
    setUndo(null);
    setHidden((current) => current.filter((id) => id !== property.id));
    const formData = new FormData();
    formData.set("propertyId", property.id);
    const result = await toggleFavorite(null, formData);
    if (!result.ok) {
      setHidden((current) => [...current, property.id]);
      toast({ title: result.formError ?? "Could not restore that home.", tone: "danger" });
      return;
    }
    toast({ title: "Saved again", description: property.title, tone: "positive" });
  }

  if (visible.length === 0) {
    return (
      <>
        <EmptyState
          icon="favorites"
          title="Nothing saved yet"
          action={<ButtonLink href="/properties">Browse homes</ButtonLink>}
        >
          Tap the heart on any listing and it lands here, ready to compare.
        </EmptyState>
        {undo ? <UndoNotice property={undo} onUndo={() => void restore(undo)} onDismiss={() => setUndo(null)} /> : null}
      </>
    );
  }

  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((property, index) => (
          <li key={property.id}>
            <PropertyCard
              property={property}
              priority={index < 2}
              action={
                <button
                  type="button"
                  onClick={() => void remove(property)}
                  aria-label={`Remove ${property.title} from saved`}
                  className="grid size-9 place-items-center rounded-md bg-paper-raised text-ink ring-1 ring-ink/10 transition-colors duration-300 ease-settle hover:bg-ink hover:text-paper"
                >
                  <X size={14} weight="bold" />
                </button>
              }
            />
          </li>
        ))}
      </ul>
      {undo ? <UndoNotice property={undo} onUndo={() => void restore(undo)} onDismiss={() => setUndo(null)} /> : null}
    </>
  );
}

function UndoNotice({
  property,
  onUndo,
  onDismiss,
}: {
  property: PropertySummary;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-(--z-toast) flex justify-center p-4 sm:justify-end sm:p-6">
      <div
        role="status"
        className="pointer-events-auto flex w-full max-w-sm items-center gap-4 rounded-panel bg-night px-5 py-4 text-on-night shadow-float ring-1 ring-white/10"
      >
        <p className="min-w-0 flex-1 text-small">
          Removed <span className="text-on-night-muted">{property.title}</span>
        </p>
        <button type="button" onClick={onUndo} className="text-small font-semibold text-accent-soft">
          Undo
        </button>
        <button type="button" onClick={onDismiss} aria-label="Dismiss notification" className="text-on-night-muted">
          <X size={13} weight="regular" />
        </button>
      </div>
    </div>
  );
}
