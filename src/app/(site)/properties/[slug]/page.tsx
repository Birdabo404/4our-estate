import { MapPin } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, type ReactNode } from "react";
import { SaveableCard } from "@/components/favorites/saveable-card";
import { LISTING_TYPE_LABEL, listingsHref, PROPERTY_TYPE_LABEL } from "@/components/listings/filters";
import { Reveal } from "@/components/motion/reveal";
import { SplitHeading } from "@/components/motion/split-heading";
import { MobileEnquireBar, MobileSoldBar } from "@/components/property-detail/enquire";
import { GalleryColumn, GalleryHero } from "@/components/property-detail/gallery";
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
import { Price } from "@/components/property/price";
import { StickyAside } from "@/components/property-detail/sticky-aside";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { StatusPill } from "@/components/ui/status-pill";
import { getPropertyBySlug, getSimilarProperties } from "@/lib/data/properties";
import { getViewer } from "@/lib/data/viewer";
import type { PropertyDetail } from "@/lib/domain/types";
import { formatListingPrice, formatLocation } from "@/lib/format";

const getProperty = cache(getPropertyBySlug);

export async function generateMetadata({ params }: PageProps<"/properties/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const property = await getProperty(slug);
  if (!property) return { title: "Home not found" };
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
    list.push({ id: "amenities", label: "Amenities", title: "What comes with it", body: <Amenities amenities={property.amenities} /> });
  }
  list.push({ id: "particulars", label: "Spec sheet", title: "The details, plainly", body: <DetailsTable property={property} /> });
  list.push({ id: "location", label: "Location", title: `${formatLocation(property)}, ${property.province}`, body: <LocationBlock property={property} /> });
  if (!sold && property.listingType === "sale") {
    list.push({ id: "finance", label: "Finance", title: "What it costs each month", body: <MortgageEstimator price={property.pricePhp} /> });
  }
  if (!sold && property.listingType === "rent") {
    list.push({ id: "lease", label: "Lease", title: "What a lease usually asks", body: <LeaseNote property={property} /> });
  }
  list.push({
    id: "agent",
    label: "Your agent",
    title: `Listed by ${property.agent.fullName}`,
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
  const rows = galleryRows(images.slice(3), 3);
  const sold = property.status === "sold";
  const agent = { firstName: firstName(property.agent.fullName), phone: property.agent.phone };

  return (
    <GalleryProvider images={images} title={property.title}>
      <GalleryHero>
        <Container width="wide">
          <p className="font-mono text-[0.75rem] text-ink-muted">
            <Link href="/properties" className="underline decoration-ink/25 underline-offset-4 transition-colors duration-300 ease-settle hover:text-ink hover:decoration-ink">
              properties
            </Link>{" "}
            <span aria-hidden>/</span>{" "}
            <Link
              href={listingsHref({ city: property.city, sort: "newest", page: 1 })}
              className="underline decoration-ink/25 underline-offset-4 transition-colors duration-300 ease-settle hover:text-ink hover:decoration-ink"
            >
              {property.city.toLowerCase()}
            </Link>{" "}
            <span aria-hidden>/</span> <span className="text-ink">{property.slug}</span>
          </p>
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            <div className="flex max-w-[56rem] flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Eyebrow dot={false}>{PROPERTY_TYPE_LABEL[property.propertyType]}</Eyebrow>
                {sold ? (
                  <StatusPill kind="listing" status="sold" />
                ) : (
                  <Eyebrow tone="accent" dot={false}>
                    {LISTING_TYPE_LABEL[property.listingType]}
                  </Eyebrow>
                )}
              </div>
              <SplitHeading as="h1" text={property.title} trigger="mount" delay={0.05} className="text-display-2 text-balance" />
              <p className="flex items-center gap-2 text-lead text-ink-soft">
                <MapPin aria-hidden size={18} weight="bold" className="shrink-0 text-accent-ink" />
                {formatLocation(property)}, {property.province}
              </p>
            </div>
            <div className="hidden shrink-0 flex-col gap-1 lg:flex lg:items-end lg:pb-1.5">
              <p className="text-micro uppercase text-ink-muted">{sold ? "Last asked" : property.listingType === "rent" ? "Monthly rent" : "Asking price"}</p>
              <Price amount={property.pricePhp} listingType={property.listingType} size="lg" />
            </div>
          </div>
        </Container>
      </GalleryHero>

      <Container width="wide" className="pb-28 pt-10 md:pt-14 lg:pb-36">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          <div className="flex min-w-0 flex-col gap-16 md:gap-20 lg:col-span-7">
            <div className="flex flex-col gap-10 lg:hidden">
              <PriceSummary property={property} />
              <AgentCard agent={property.agent} />
              {sold && <SoldNote property={property} />}
            </div>

            <section aria-label="Overview" className="flex flex-col gap-10">
              <Reveal>
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
        <section id="similar" aria-label="Homes nearby" className="scroll-mt-24 border-t border-ink/10 bg-sky-soft py-20 md:py-28">
          <Container width="wide" className="flex flex-col gap-10 md:gap-14">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-4">
                <p className="text-micro uppercase text-ink-muted">Also in {property.city}</p>
                <SplitHeading as="h2" text="Homes *nearby*." className="text-display-3" />
              </div>
              <ButtonLink href={listingsHref({ city: property.city, sort: "newest", page: 1 })} variant="secondary" icon="arrow-right" className="self-start md:self-auto">
                All of {property.city}
              </ButtonLink>
            </div>
            <ul className="grid gap-5 sm:grid-cols-2 md:gap-6 xl:grid-cols-3">
              {similar.map((item, i) => (
                <Reveal as="li" key={item.id} index={i}>
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
