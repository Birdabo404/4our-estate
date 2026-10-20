import { ArrowDown } from "@phosphor-icons/react/ssr";
import { Reveal } from "@/components/motion/reveal";
import { ScrollImage } from "@/components/motion/scroll-image";
import { SplitHeading } from "@/components/motion/split-heading";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section } from "@/components/ui/section";

const HERO = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=2400&q=80&auto=format&fit=crop";
const INTERIOR = "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80&auto=format&fit=crop";

export default function HomePage() {
  return (
    <>
      <section data-nav-surface="image" className="relative isolate flex min-h-[100dvh] flex-col justify-end overflow-hidden bg-night text-white">
        <ScrollImage
          src={HERO}
          alt="A dark timber house glowing at dusk beneath an old acacia tree"
          sizes="100vw"
          preload
          intensity="hero"
          className="absolute inset-0 -z-10"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(20_18_15/0.45)_0%,rgb(20_18_15/0)_26%,rgb(20_18_15/0.1)_50%,rgb(20_18_15/0.72)_100%)]" />

        <Container width="wide" className="pb-12 md:pb-16">
          <div className="grid items-end gap-12 md:grid-cols-12">
            <div className="md:col-span-9">
              <Reveal delay={0.2}>
                <Eyebrow tone="image">Private collection · Philippines</Eyebrow>
              </Reveal>
              <SplitHeading
                as="h1"
                trigger="mount"
                delay={0.35}
                text="Residences of *quiet* consequence."
                className="mt-7 max-w-[11ch] text-display-1 text-white"
              />
            </div>
            <Reveal delay={0.9} className="flex flex-col items-start gap-8 md:col-span-3 md:items-end md:text-right">
              <p className="max-w-[30ch] text-small text-white/90">
                Homes in Forbes Park, Rockwell, Alabang, Tagaytay, and Cebu, represented by people who know them by name.
              </p>
              <ButtonLink href="/properties" variant="on-image" size="lg" magnetic>
                Browse properties
              </ButtonLink>
            </Reveal>
          </div>
          <div className="mt-14 flex items-center justify-between border-t border-white/20 pt-5 text-micro uppercase text-white/70">
            <span>Forbes Park, Makati</span>
            <span className="flex items-center gap-3">
              Scroll <ArrowDown aria-hidden size={12} weight="light" />
            </span>
          </div>
        </Container>
      </section>

      <Section>
        <Container width="wide" className="grid items-center gap-16 md:grid-cols-12 md:gap-10">
          <ScrollImage
            src={INTERIOR}
            alt="A calm living room with white sofas and a warm timber wall"
            sizes="(min-width: 768px) 50vw, 100vw"
            className="aspect-[4/5] rounded-photo md:col-span-6"
          />
          <div className="md:col-span-5 md:col-start-8">
            <Eyebrow>The house view</Eyebrow>
            <SplitHeading text="A smaller collection, chosen with *care*." className="mt-7 text-display-3" />
            <Reveal>
              <p className="mt-8 max-w-[42ch] text-lead text-ink-soft">
                Every residence is visited, photographed, and written about by the agent who will walk you through it. Fewer
                listings, each one complete.
              </p>
            </Reveal>
            <Reveal delay={0.15} className="mt-12">
              <ButtonLink href="/properties" variant="secondary" icon="arrow-right">
                See the residences
              </ButtonLink>
            </Reveal>
          </div>
        </Container>
      </Section>
    </>
  );
}
