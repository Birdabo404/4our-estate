"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { saveListing } from "@/lib/actions/listings";
import {
  LISTING_TYPES,
  PROPERTY_TYPES,
  type ListingType,
  type PropertyDetail,
  type PropertyType,
} from "@/lib/domain/types";
import { listingSchema, readListing } from "@/lib/validation/listing";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, SegmentedControl, Select, Textarea } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";

import { FormAlert } from "@/components/dashboard/form-alert";
import { useZodForm } from "@/components/dashboard/use-zod-form";
import { fieldErrors } from "@/components/dashboard/zod-form";

const ORDER = [
  "title",
  "slug",
  "listingType",
  "propertyType",
  "pricePhp",
  "bedrooms",
  "bathrooms",
  "floorAreaSqm",
  "lotAreaSqm",
  "parkingSlots",
  "yearBuilt",
  "neighborhood",
  "city",
  "province",
  "address",
  "latitude",
  "longitude",
  "amenities",
  "description",
] as const;

const AMENITIES = [
  "Pool",
  "Garden",
  "Security",
  "Generator",
  "Elevator",
  "Balcony",
  "Maid's room",
  "Gym",
  "Furnished",
  "Beach access",
  "City view",
] as const;

const TYPE_LABEL: Record<PropertyType, string> = {
  house: "House",
  condominium: "Condominium",
  townhouse: "Townhouse",
  villa: "Villa",
  penthouse: "Penthouse",
  lot: "Lot",
};

const LISTING_LABEL: Record<ListingType, string> = {
  sale: "For sale",
  rent: "For lease",
};

function normalizeAmenities(formData: FormData) {
  const values = formData.getAll("amenities").flatMap((value) =>
    String(value)
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0),
  );
  formData.delete("amenities");
  for (const item of new Set(values)) formData.append("amenities", item);
}

function parseListing(formData: FormData): Record<string, string> {
  normalizeAmenities(formData);
  const parsed = listingSchema.safeParse(readListing(formData));
  return parsed.success ? {} : fieldErrors(parsed.error);
}

export function ListingForm({ property }: { property: PropertyDetail | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const { state, pending, errorFor, formError, onBlur, onSubmit } = useZodForm(
    saveListing,
    parseListing,
    ORDER,
    normalizeAmenities,
  );
  const reported = useRef(state);

  useEffect(() => {
    if (!state || state === reported.current) return;
    reported.current = state;
    if (!state.ok) return;
    toast({ title: property ? "Listing updated" : "Draft saved", tone: "positive" });
    if (property) router.refresh();
    else router.push(`/dashboard/agent/listings/${state.data.id}`);
  }, [state, toast, router, property]);

  const known = new Set<string>(AMENITIES);
  const selected = new Set(property?.amenities ?? []);
  const extras = (property?.amenities ?? []).filter((item) => !known.has(item)).join(", ");

  return (
    <form noValidate onSubmit={onSubmit} onBlur={onBlur} className="flex flex-col gap-8">
      <input type="hidden" name="id" value={property?.id ?? ""} />
      <Section title="Basics" lede="The name a buyer will remember.">
        <div className="md:col-span-2">
          <Field label="Title" error={errorFor("title")} required>
            <Input name="title" defaultValue={property?.title ?? ""} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Listing" error={errorFor("listingType")} required>
            <SegmentedControl
              name="listingType"
              aria-label="Listing"
              defaultValue={property?.listingType ?? "sale"}
              options={LISTING_TYPES.map((value) => ({ value, label: LISTING_LABEL[value] }))}
            />
          </Field>
        </div>
        <Field label="Type" error={errorFor("propertyType")} required>
          <Select name="propertyType" defaultValue={property?.propertyType ?? "house"}>
            {PROPERTY_TYPES.map((value) => (
              <option key={value} value={value}>
                {TYPE_LABEL[value]}
              </option>
            ))}
          </Select>
        </Field>
        <div className="md:col-span-2">
          <Field label="Slug" hint="Optional. Leave blank and one will be written from the title." error={errorFor("slug")}>
            <Input name="slug" defaultValue={property?.slug ?? ""} spellCheck={false} />
          </Field>
        </div>
      </Section>

      <Section title="Price and size">
        <Field label="Price in pesos" hint="Whole pesos, without commas." error={errorFor("pricePhp")} required>
          <Input name="pricePhp" inputMode="numeric" defaultValue={property ? String(property.pricePhp) : ""} className="tabular" />
        </Field>
        <Field label="Bedrooms" error={errorFor("bedrooms")} required>
          <Input name="bedrooms" inputMode="numeric" defaultValue={property ? String(property.bedrooms) : ""} className="tabular" />
        </Field>
        <Field label="Bathrooms" error={errorFor("bathrooms")} required>
          <Input name="bathrooms" inputMode="decimal" step="0.5" defaultValue={property ? String(property.bathrooms) : ""} className="tabular" />
        </Field>
        <Field label="Floor area" hint="Square meters." error={errorFor("floorAreaSqm")} required>
          <Input name="floorAreaSqm" inputMode="decimal" step="0.1" defaultValue={property ? String(property.floorAreaSqm) : ""} className="tabular" />
        </Field>
        <Field label="Lot area" hint="Optional. Square meters." error={errorFor("lotAreaSqm")}>
          <Input name="lotAreaSqm" inputMode="decimal" step="0.1" defaultValue={property?.lotAreaSqm ?? ""} className="tabular" />
        </Field>
        <Field label="Parking" error={errorFor("parkingSlots")} required>
          <Input name="parkingSlots" inputMode="numeric" defaultValue={property ? String(property.parkingSlots) : ""} className="tabular" />
        </Field>
        <Field label="Year built" hint="Optional." error={errorFor("yearBuilt")}>
          <Input name="yearBuilt" inputMode="numeric" defaultValue={property?.yearBuilt ?? ""} className="tabular" />
        </Field>
      </Section>

      <Section title="Location">
        <Field label="Neighborhood" error={errorFor("neighborhood")} required>
          <Input name="neighborhood" defaultValue={property?.neighborhood ?? ""} />
        </Field>
        <Field label="City" error={errorFor("city")} required>
          <Input name="city" defaultValue={property?.city ?? ""} />
        </Field>
        <Field label="Province" error={errorFor("province")} required>
          <Input name="province" defaultValue={property?.province ?? ""} />
        </Field>
        <Field label="Street address" error={errorFor("address")} required>
          <Input name="address" autoComplete="street-address" defaultValue={property?.address ?? ""} />
        </Field>
        <Field label="Latitude" hint="Optional. Enter both coordinates, or neither." error={errorFor("latitude")}>
          <Input name="latitude" inputMode="decimal" defaultValue={property?.latitude ?? ""} className="tabular" />
        </Field>
        <Field label="Longitude" error={errorFor("longitude")}>
          <Input name="longitude" inputMode="decimal" defaultValue={property?.longitude ?? ""} className="tabular" />
        </Field>
      </Section>

      <Section title="Details and amenities">
        <fieldset className="md:col-span-2">
          <legend className="text-small font-medium text-ink">Amenities</legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {AMENITIES.map((amenity) => (
              <Checkbox key={amenity} name="amenities" value={amenity} label={amenity} defaultChecked={selected.has(amenity)} />
            ))}
          </div>
          <div className="mt-6">
            <Field label="Other amenities" hint="Separate extra names with commas." error={errorFor("amenities")}>
              <Input name="amenities" defaultValue={extras} />
            </Field>
          </div>
        </fieldset>
      </Section>

      <Section title="Description">
        <div className="md:col-span-2">
          <Field label="Description" error={errorFor("description")} required>
            <Textarea name="description" defaultValue={property?.description ?? ""} />
          </Field>
        </div>
      </Section>

      <div className="flex flex-col items-start gap-4">
        <FormAlert message={formError} />
        <Button type="submit" disabled={pending} icon="arrow-right">
          {pending ? "Saving…" : property ? "Save changes" : "Save draft"}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, lede, children }: { title: string; lede?: string; children: ReactNode }) {
  return (
    <Panel>
      <h2 className="font-display text-heading">{title}</h2>
      {lede ? <p className="mt-2 max-w-[42ch] text-small text-ink-muted">{lede}</p> : null}
      <div className="mt-8 grid gap-6 md:grid-cols-2">{children}</div>
    </Panel>
  );
}
