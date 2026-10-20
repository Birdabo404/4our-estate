import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { StatusPill } from "@/components/ui/status-pill";
import { getPropertyBySlug } from "@/lib/data/properties";
import { formatListingPrice, formatLocation } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  return { title: property?.title ?? "Residence" };
}

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property || (property.status !== "published" && property.status !== "sold")) notFound();

  return (
    <article className="pb-24 pt-32 md:pb-36 md:pt-40">
      <Container width="wide">
        <Eyebrow>{formatLocation(property)}</Eyebrow>
        <h1 className="mt-6 max-w-[16ch] text-display-2">{property.title}</h1>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <StatusPill kind="listing" status={property.status} />
          <p className="text-lead tabular">{formatListingPrice(property.pricePhp, property.listingType)}</p>
        </div>
        {property.coverImage ? (
          <div className="relative mt-12 aspect-[16/9] overflow-hidden rounded-photo bg-paper-sunken">
            <Image
              src={property.coverImage.url}
              alt={property.coverImage.alt}
              fill
              sizes="(min-width: 1024px) 90vw, 100vw"
              className="object-cover"
              preload
              unoptimized={
                property.coverImage.url.startsWith("http://127.0.0.1") ||
                property.coverImage.url.startsWith("http://localhost")
              }
            />
          </div>
        ) : null}
        <p className="mt-10 max-w-[62ch] text-body text-ink-soft">{property.description}</p>
      </Container>
    </article>
  );
}
