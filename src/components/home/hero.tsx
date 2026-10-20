"use client";

import { ArrowDown } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { useRef } from "react";
import { Reveal } from "@/components/motion/reveal";
import { ScrollImage } from "@/components/motion/scroll-image";
import { SplitHeading } from "@/components/motion/split-heading";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { gsap, MEDIA, useGSAP } from "@/lib/gsap";
import type { Photo } from "@/lib/photography/catalog";
import { photoUrl } from "@/lib/photography/catalog";

export function HomeHero({ photo, listingCount, cityCount }: { photo: Photo; listingCount: number; cityCount: number }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motionOk, () => {
        gsap.to("[data-hero-copy]", {
          yPercent: -18,
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "75% top", scrub: 0.5 },
        });
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      data-nav-surface="image"
      className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden bg-night text-white"
    >
      <ScrollImage src={photoUrl(photo, 2400, 80)} alt={photo.alt} sizes="100vw" preload intensity="hero" className="absolute inset-0 -z-10" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(20_18_15/0.5)_0%,rgb(20_18_15/0)_28%,rgb(20_18_15/0.08)_52%,rgb(20_18_15/0.76)_100%)]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_55%_at_0%_100%,rgb(20_18_15/0.5),rgb(20_18_15/0))]" />
      <div aria-hidden className="absolute inset-0 -z-10 hidden bg-[radial-gradient(45%_50%_at_100%_100%,rgb(20_18_15/0.62),rgb(20_18_15/0))] md:block" />

      <Container width="wide" className="pb-10 md:pb-14">
        <div data-hero-copy className="grid items-end gap-10 md:grid-cols-12 md:gap-12">
          <div className="flex flex-col gap-7 md:col-span-7 lg:col-span-8">
            <Reveal delay={0.2} distance={12}>
              <Eyebrow tone="image">Private collection · Philippines</Eyebrow>
            </Reveal>
            <SplitHeading
              as="h1"
              trigger="mount"
              delay={0.35}
              text="Residences of *quiet* consequence."
              className="max-w-[11ch] text-display-1 text-white [--opsz:144]"
            />
          </div>
          <Reveal delay={0.9} distance={16} className="flex flex-col items-start gap-7 md:col-span-5 md:items-end md:text-right lg:col-span-4">
            <p className="max-w-[32ch] text-small text-white/88">
              Houses, villas, and apartments from Forbes Park to Siargao, each represented by the agent who knows it by name.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4 md:justify-end">
              <ButtonLink href="/properties" variant="on-image" size="lg" icon="arrow-up-right" magnetic>
                View the collection
              </ButtonLink>
              <Link
                href="/properties?listingType=rent"
                className="text-small text-white underline decoration-white/35 underline-offset-[6px] transition-colors duration-300 ease-settle hover:decoration-white"
              >
                Leases
              </Link>
            </div>
          </Reveal>
        </div>
        <div className="mt-12 flex items-center justify-between border-t border-white/20 pt-5 text-micro uppercase text-white/70 md:mt-16">
          <span className="tabular">
            {listingCount} residences · {cityCount} places
          </span>
          <span className="flex items-center gap-3">
            Scroll <ArrowDown aria-hidden size={12} weight="light" />
          </span>
        </div>
      </Container>
    </section>
  );
}
