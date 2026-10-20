import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache, type ReactNode } from "react";
import { SaveableCard } from "@/components/favorites/saveable-card";
import { LISTING_TYPE_LABEL, listingsHref, PROPERTY_TYPE_LABEL } from "@/components/listings/filters";
import { Reveal } from "@/components/motion/reveal";
import { SplitHeading } from "@/components/motion/split-heading";
import { MobileEnquireBar, MobileSoldBar } from "@/components/property-detail/enquire";
import { GalleryColumn, GalleryHero, OpenGalleryButton } from "@/components/property-detail/gallery";
import { GalleryProvider } from "@/components/property-detail/gallery-state";
import { InfoPanel, PriceSummary, SoldNote } from "@/components/property-detail/info-panel";
import { MortgageEstimator } from "@/components/property-detail/mortgage-estimator";
import { galleryRows, withRatios } from "@/components/property-detail/photo-meta";
import {
  AgentCard,
  AgentProfileBlock,
  Amenities,
  Chapter,
  DetailsTable,
  firstName,
  KeyFacts,
  LeaseNote,
  LocationBlock,
  Overview,
} from "@/components/property-detail/sections";
import { StickyAside } from "@/components/property-detail/sticky-aside";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { StatusPill } from "@/components/ui/status-pill";
import { getPropertyBySlug, getSimilarProperties } from "@/lib/data/properties";
import { getViewer } from "@/lib/data/viewer";
import type { PropertyDetail } from "@/lib/domain/types";
import { cn } from "@/lib/cn";
import { formatListingPrice, formatLocation } from "@/lib/format";

const getProperty = cache(getPropertyBySlug);

export async function generateMetadata({ params }: PageProps<"/properties/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const property = await getProperty(slug);
  if (!property) return { title: "Residence not found" };
  const cover = property.images[0] ?? property.coverImage;
  const description = `${PROPERTY_TYPE_LABEL[property.propertyType]} in ${formatLocation(property)}. ${formatListingPrice(property.pricePhp, property.listingType)}.`;
  return {
    title: property.title,
    description,
    openGraph: {
      title: property.title,
      description,
      type: "website",
      images: cover ? [{ url: cover.url, alt: cover.alt }] : undefined,
    },
  };
}

type ChapterSpec = { id: string; label: string; title: string; body: ReactNode };

function chapters(property: PropertyDetail): ChapterSpec[] {
  const sold = property.status === "sold";
  const list: ChapterSpec[] = [];
  if (property.amenities.length > 0) {
    list.push({ id: "amenities", label: "Residence", title: "What the house holds", body: <Amenities amenities={property.amenities} /> });
  }
  list.push({ id: "particulars", label: "Particulars", title: "The details, plainly", body: <DetailsTable property={property} /> });
  list.push({ id: "location", label: "Location", title: `${formatLocation(property)}, ${property.province}`, body: <LocationBlock property={property} /> });
  if (!sold && property.listingType === "sale") {
    list.push({ id: "finance", label: "Finance", title: "What it would ask of you each month", body: <MortgageEstimator price={property.pricePhp} /> });
  }
  if (!sold && property.listingType === "rent") {
    list.push({ id: "lease", label: "Lease", title: "What a lease usually asks", body: <LeaseNote property={property} /> });
  }
  list.push({
    id: "agent",
    label: "Representation",
    title: `Represented by ${property.agent.fullName}`,
    body: <AgentProfileBlock agent={property.agent} />,
  });
  return list;
}

export default async function PropertyPage({ params }: PageProps<"/properties/[slug]">) {
  const { slug } = await params;
  const property = await getProperty(slug);
  if (!property) notFound();

  const [similar, viewer] = await Promise.all([getSimilarProperties(property), getViewer()]);
  const defaults = viewer.kind === "member" ? { name: viewer.fullName, email: viewer.email } : { name: "", email: "" };
  const images = withRatios(property.images);
  const rows = galleryRows(images.slice(1), 1);
  const sold = property.status === "sold";
  const agent = { firstName: firstName(property.agent.fullName), phone: property.agent.phone };

  return (
    <GalleryProvider images={images} title={property.title}>
      <GalleryHero>
        <Container width="wide" className="pb-10 pt-40 md:pb-16">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:gap-12">
            <div className="flex max-w-[60rem] flex-col gap-6">
              <div className="flex flex-wrap items-center gap-3">
                <Eyebrow tone="image">
                  {sold ? PROPERTY_TYPE_LABEL[property.propertyType] : `${PROPERTY_TYPE_LABEL[property.propertyType]} · ${LISTING_TYPE_LABEL[property.listingType]}`}
                </Eyebrow>
                {sold && <StatusPill kind="listing" status="sold" className="bg-paper text-ink ring-paper" />}
              </div>
              <SplitHeading
                as="h1"
                text={property.title}
                trigger="mount"
                delay={0.15}
                className="font-display text-display-2 text-balance"
              />
              <p className="text-lead text-white/85">
                {formatLocation(property)}, {property.province}
              </p>
            </div>
            <div className="shrink-0">
              <OpenGalleryButton />
            </div>
          </div>
        </Container>
      </GalleryHero>

      <Container width="wide" className="pb-28 pt-12 md:pt-20 lg:pb-40">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-12 xl:gap-20">
          <div className="flex min-w-0 flex-col gap-20 md:gap-28 lg:col-span-7">
            <div className="flex flex-col gap-10 lg:hidden">
              <PriceSummary property={property} />
              <AgentCard agent={property.agent} />
              {sold && <SoldNote property={property} />}
            </div>

            <section aria-label="Overview" className="flex flex-col gap-12">
              <Reveal distance={16}>
                <KeyFacts property={property} />
              </Reveal>
              <Overview property={property} />
            </section>

            <GalleryColumn rows={rows} />

            {chapters(property).map((chapter, i) => (
              <Chapter key={chapter.id} id={chapter.id} index={i + 1} label={chapter.label} title={chapter.title}>
                {chapter.body}
              </Chapter>
            ))}
          </div>

          <aside aria-label={sold ? "Status" : "Enquire"} className="hidden lg:col-span-5 lg:block">
            <StickyAside>
              <InfoPanel property={property} defaults={defaults} />
            </StickyAside>
          </aside>
        </div>
      </Container>

      {similar.length > 0 && (
        <section id="similar" aria-label="Residences nearby" className="scroll-mt-24 bg-paper-raised py-24 md:py-36">
          <Container width="wide" className="flex flex-col gap-14 md:gap-20">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-4">
                <p className="text-micro uppercase text-ink-muted">Also in {property.city}</p>
                <SplitHeading as="h2" text="Residences *nearby*" className="font-display text-display-3" />
              </div>
              <ButtonLink href={listingsHref({ city: property.city, sort: "newest", page: 1 })} variant="secondary" icon="arrow-right" className="self-start md:self-auto">
                All of {property.city}
              </ButtonLink>
            </div>
            <ul className="grid gap-x-8 gap-y-16 md:grid-cols-2 md:gap-x-10 xl:grid-cols-3">
              {similar.map((item, i) => (
                <Reveal as="li" key={item.id} index={i} className={cn(i === 1 && "xl:mt-20")}>
                  <SaveableCard property={item} />
                </Reveal>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {sold ? (
        <MobileSoldBar href={similar.length > 0 ? "#similar" : listingsHref({ city: property.city, sort: "newest", page: 1 })} />
      ) : (
        <MobileEnquireBar
          propertyId={property.id}
          title={property.title}
          listingType={property.listingType}
          pricePhp={property.pricePhp}
          agent={agent}
          defaults={defaults}
        />
      )}
    </GalleryProvider>
  );
}
