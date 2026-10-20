import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CountUp } from "@/components/motion/count-up";
import { Reveal } from "@/components/motion/reveal";
import { ScrollImage } from "@/components/motion/scroll-image";
import { SplitHeading } from "@/components/motion/split-heading";
import { Wordmark } from "@/components/motion/wordmark";
import { PropertyCard } from "@/components/property/property-card";
import { PropertyCardSkeleton } from "@/components/property/property-card-skeleton";
import { Price } from "@/components/property/price";
import { Button, ButtonLink, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { INQUIRY_STATUSES, LISTING_STATUSES } from "@/lib/domain/types";
import { cn } from "@/lib/cn";
import { contrastRatio, readTokens } from "@/lib/contrast";
import { duration, ease, stagger } from "@/lib/motion";
import { FavoriteDemo, InquiryFormDemo, OverlayDemo, WordmarkDemo } from "./demos";
import { FIXTURE_PROPERTIES } from "./fixtures";

export const metadata: Metadata = {
  title: "Design system",
  description: "The living reference for the 4OUR Estate design language.",
};

const SECTIONS = [
  { id: "principles", label: "Principles" },
  { id: "palette", label: "Palette" },
  { id: "type", label: "Typography" },
  { id: "space", label: "Space and form" },
  { id: "buttons", label: "Buttons" },
  { id: "fields", label: "Fields" },
  { id: "status", label: "Status" },
  { id: "panels", label: "Panels" },
  { id: "overlays", label: "Overlays" },
  { id: "loading", label: "Loading and empty" },
  { id: "motion", label: "Motion" },
  { id: "cards", label: "Property cards" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const SWATCHES: ReadonlyArray<{ group: string; tokens: ReadonlyArray<{ name: string; role: string; against: string }> }> = [
  {
    group: "Paper",
    tokens: [
      { name: "paper", role: "Canvas", against: "ink" },
      { name: "paper-raised", role: "Panels, fields", against: "ink" },
      { name: "paper-sunken", role: "Wells, placeholders", against: "ink-muted" },
    ],
  },
  {
    group: "Ink",
    tokens: [
      { name: "ink", role: "Headings, body", against: "paper" },
      { name: "ink-soft", role: "Secondary copy", against: "paper" },
      { name: "ink-muted", role: "Meta, captions", against: "paper" },
    ],
  },
  {
    group: "Night",
    tokens: [
      { name: "night", role: "Footer, scrims", against: "on-night" },
      { name: "night-raised", role: "Dark panels", against: "on-night" },
      { name: "on-night-muted", role: "Meta on night", against: "night" },
    ],
  },
  {
    group: "Accent and function",
    tokens: [
      { name: "accent", role: "Narra brass. Focus, emphasis", against: "paper" },
      { name: "accent-soft", role: "Accent on night", against: "night" },
      { name: "positive", role: "Published, contacted", against: "paper" },
      { name: "danger", role: "Errors", against: "paper" },
    ],
  },
];

const TYPE_SCALE: ReadonlyArray<{ token: string; sample: string; family: "display" | "sans"; use: string; className: string }> = [
  { token: "display-1", sample: "Residences of quiet consequence", family: "display", use: "Hero, once per page", className: "text-display-1" },
  { token: "display-2", sample: "The Acacia House", family: "display", use: "Listing titles on detail", className: "text-display-2" },
  { token: "display-3", sample: "A smaller collection", family: "display", use: "Section headings", className: "text-display-3" },
  { token: "heading", sample: "Schedule a private viewing", family: "display", use: "Panels, dialogs, feature cards", className: "text-heading" },
  { token: "title", sample: "Two-bedroom residence at Rockwell", family: "display", use: "Card titles", className: "text-title" },
  { token: "lead", sample: "Every residence is visited and written about by the agent who will walk you through it.", family: "sans", use: "Intros", className: "text-lead" },
  { token: "body", sample: "Set on 1,200 sqm of terraced garden, the residence opens to the lake through floor-to-ceiling glass.", family: "sans", use: "Running text", className: "text-body" },
  { token: "small", sample: "4 beds · 5 baths · 320 sqm", family: "sans", use: "Facts, labels, buttons", className: "text-small" },
  { token: "micro", sample: "Forbes Park · For sale", family: "sans", use: "Eyebrows, uppercase only", className: "text-micro uppercase font-medium" },
];

const SPACE_SCALE = [4, 8, 12, 16, 24, 32, 48, 64, 96, 144, 176] as const;

const BUTTON_VARIANTS: readonly ButtonVariant[] = ["primary", "secondary", "ghost"];
const BUTTON_SIZES: readonly ButtonSize[] = ["sm", "md", "lg"];

const OWNERSHIP: ReadonlyArray<{ library: string; owns: string; primitives: string }> = [
  {
    library: "Framer Motion",
    owns: "Component state and gesture: hover, press, presence, layout and shared elements, menu, dialogs, sheets, toasts, form errors, in-view reveals",
    primitives: "Button, Reveal, Dialog, Sheet, Toast, SegmentedControl, PropertyCard, SiteNav",
  },
  {
    library: "GSAP + ScrollTrigger",
    owns: "Scroll-linked choreography: hero scale and parallax, clip-path image reveals, pinned or horizontal sequences",
    primitives: "ScrollImage, via @/lib/gsap only",
  },
  {
    library: "Anime.js v4",
    owns: "SVG and type sequencing: stroke draws, split-word headlines, numeric count-ups",
    primitives: "Wordmark, SplitHeading, CountUp",
  },
];

const PHOTO = "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&q=80&auto=format&fit=crop";

function Spec({ id, index, title, children, intro }: { id: SectionId; index: number; title: string; intro: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-28 border-t border-ink/10 py-20 md:py-28">
      <div className="grid gap-6 md:grid-cols-12">
        <p className="font-sans text-micro font-medium uppercase text-ink-muted md:col-span-2">{String(index).padStart(2, "0")}</p>
        <div className="md:col-span-10">
          <h2 id={`${id}-title`} className="text-display-3">
            {title}
          </h2>
          <div className="mt-5 max-w-[62ch] text-body text-ink-soft">{intro}</div>
        </div>
      </div>
      <div className="mt-14">{children}</div>
    </section>
  );
}

export default function StyleguidePage() {
  const tokens = readTokens(readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8"));
  const hex = (name: string) => tokens.get(`color-${name}`) ?? "#000000";
  const [feature, ...rest] = FIXTURE_PROPERTIES;

  return (
    <>
      <header className="sticky top-0 z-(--z-nav) border-b border-ink/[0.07] bg-paper/85 backdrop-blur-xl">
        <Container width="wide" className="flex h-16 items-center justify-between">
          <Link href="/" className="rounded-full py-2 text-[1.2rem]" aria-label="4OUR Estate, home">
            <Wordmark />
          </Link>
          <span className="text-micro font-medium uppercase text-ink-muted">Design system · v1</span>
        </Container>
      </header>

      <main id="main" tabIndex={-1} className="outline-none">
        <Container width="wide" className="pt-20 md:pt-28">
          <Eyebrow>Living reference</Eyebrow>
          <SplitHeading as="h1" trigger="mount" text="The *quiet* system behind 4OUR Estate." className="mt-8 max-w-[14ch] text-display-2" />
          <p className="mt-8 max-w-[56ch] text-lead text-ink-soft">
            Editorial luxury, photography first. This page renders the real components with fixture data, so it doubles as
            the visual test and the academic record of every design decision.
          </p>
        </Container>

        <Container width="wide" className="mt-20 grid gap-10 lg:grid-cols-12">
          <nav aria-label="Sections" className="hidden lg:col-span-2 lg:block">
            <ol className="sticky top-28 flex flex-col gap-2.5 text-small">
              {SECTIONS.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="group flex gap-3 text-ink-muted transition-colors duration-500 ease-settle hover:text-ink">
                    <span className="tabular w-5 text-[0.75rem]">{String(i + 1).padStart(2, "0")}</span>
                    {s.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="min-w-0 lg:col-span-10">
            <Spec
              id="principles"
              index={1}
              title="Principles"
              intro="Archetype: Editorial Luxury. The photograph is the hero, paper and ink set the stage, and one brass accent marks what matters."
            >
              <ol className="grid gap-px overflow-hidden rounded-[1.25rem] bg-ink/10 md:grid-cols-3">
                {[
                  ["Photography leads", "Images run large, unboxed, and slow. UI recedes to make room."],
                  ["Quiet confidence", "One accent, soft contrast, no badges shouting. Hierarchy comes from scale and space."],
                  ["Motion with mass", "Things settle like heavy paper. Nothing bounces, nothing loops for attention."],
                ].map(([title, body], i) => (
                  <Reveal as="li" index={i} key={title} className="flex flex-col gap-3 bg-paper p-8">
                    <span className="font-display text-heading italic text-accent">{i + 1}</span>
                    <h3 className="text-title">{title}</h3>
                    <p className="text-small text-ink-soft">{body}</p>
                  </Reveal>
                ))}
              </ol>
            </Spec>

            <Spec
              id="palette"
              index={2}
              title="Palette"
              intro={
                <>
                  Warm paper, espresso ink, and a single Narra brass accent. Ratios below are computed live from{" "}
                  <code className="text-small">globals.css</code> against each colour&apos;s intended partner. Every text pairing
                  clears WCAG AA.
                </>
              }
            >
              <div className="flex flex-col gap-12">
                {SWATCHES.map((group) => (
                  <div key={group.group}>
                    <h3 className="font-sans text-micro font-medium uppercase text-ink-muted">{group.group}</h3>
                    <ul className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                      {group.tokens.map((t) => {
                        const ratio = contrastRatio(hex(t.name), hex(t.against));
                        return (
                          <li key={t.name} className="flex flex-col gap-3">
                            <div
                              className="flex aspect-[4/3] items-end rounded-[1rem] p-4 ring-1 ring-inset ring-ink/[0.08]"
                              style={{ background: hex(t.name), color: hex(t.against) }}
                            >
                              <span className="font-display text-[2rem] leading-none">Aa</span>
                            </div>
                            <div className="flex flex-col text-small">
                              <span className="font-medium">{t.name}</span>
                              <span className="text-ink-muted">
                                {hex(t.name)} · {ratio.toFixed(1)}:1 with {t.against}
                              </span>
                              <span className="text-ink-muted">{t.role}</span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </Spec>

            <Spec
              id="type"
              index={3}
              title="Typography"
              intro="Bodoni Moda for display, Jost for everything you read. Didone over Futura is the pairing of the great fashion mastheads: high contrast for presence, geometric calm for reading. Bodoni's optical size is pinned near 30 so hairlines survive at hero sizes."
            >
              <div className="grid gap-6 md:grid-cols-2">
                <Panel coreClassName="flex flex-col gap-4">
                  <span className="text-micro font-medium uppercase text-ink-muted">Display · Bodoni Moda</span>
                  <span className="font-display text-[4.5rem] leading-none">
                    Aa <em className="text-accent">Ff</em> ₱48
                  </span>
                  <span className="text-small text-ink-muted">Weights 400 to 500. Italic for one emphasised word per heading.</span>
                </Panel>
                <Panel coreClassName="flex flex-col gap-4">
                  <span className="text-micro font-medium uppercase text-ink-muted">Text · Jost</span>
                  <span className="font-sans text-[4.5rem] font-light leading-none">
                    Aa <span className="font-medium">Gg</span> 320
                  </span>
                  <span className="text-small text-ink-muted">Weights 300 to 500. Uppercase only at micro size with 0.24em tracking.</span>
                </Panel>
              </div>
              <ul className="mt-14 flex flex-col">
                {TYPE_SCALE.map((t) => (
                  <li key={t.token} className="grid items-baseline gap-3 border-t border-ink/10 py-7 md:grid-cols-12">
                    <div className="flex flex-col gap-1 text-small md:col-span-3">
                      <span className="font-medium">text-{t.token}</span>
                      <span className="text-ink-muted">{t.use}</span>
                    </div>
                    <p className={cn("min-w-0 md:col-span-9", t.family === "display" && "font-display", t.className)}>{t.sample}</p>
                  </li>
                ))}
              </ul>
            </Spec>

            <Spec
              id="space"
              index={4}
              title="Space and form"
              intro="A 4px base grid with macro whitespace: sections breathe at 96 to 176px. Radii stay restrained on photography (3px) and soften on interactive UI. Shadows are layered, warm, and diffused."
            >
              <div className="grid gap-16 md:grid-cols-2">
                <ul className="flex flex-col gap-3">
                  {SPACE_SCALE.map((px) => (
                    <li key={px} className="flex items-center gap-5 text-small">
                      <span className="tabular w-12 text-ink-muted">{px}px</span>
                      <span className="h-2 rounded-full bg-accent/70" style={{ width: px * 1.6 }} />
                    </li>
                  ))}
                </ul>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    ["rounded-photo", "3px · photography", "rounded-photo"],
                    ["rounded-field", "14px · inputs", "rounded-field"],
                    ["rounded-panel", "32px · panel shell", "rounded-panel"],
                    ["rounded-full", "pills, buttons", "rounded-full"],
                  ].map(([name, note, cls]) => (
                    <div key={name} className="flex flex-col gap-3">
                      <div className={cn("aspect-[4/3] bg-paper-raised ring-1 ring-inset ring-ink/10", cls)} />
                      <span className="text-small">
                        {name} <span className="text-ink-muted">· {note}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-16 grid gap-6 md:grid-cols-3">
                {[
                  ["shadow-hairline", "Resting surfaces"],
                  ["shadow-lift", "Buttons, pills"],
                  ["shadow-float", "Panels, overlays, toasts"],
                ].map(([cls, note]) => (
                  <div key={cls} className={cn("flex h-36 flex-col justify-end rounded-[1.25rem] bg-paper-raised p-6", cls)}>
                    <span className="text-small font-medium">{cls}</span>
                    <span className="text-small text-ink-muted">{note}</span>
                  </div>
                ))}
              </div>
            </Spec>

            <Spec
              id="buttons"
              index={5}
              title="Buttons"
              intro="Pills with a nested icon well. On hover the well drifts up-right and its arrow swaps for a twin arriving from below. Press compresses the whole shell to 97.5%. The hero CTA alone may be magnetic."
            >
              <div className="flex flex-col gap-10">
                {BUTTON_VARIANTS.map((variant) => (
                  <div key={variant} className="grid items-center gap-5 md:grid-cols-12">
                    <span className="text-small text-ink-muted md:col-span-2">{variant}</span>
                    <div className="flex flex-wrap items-center gap-4 md:col-span-10">
                      {BUTTON_SIZES.map((size) => (
                        <Button key={size} variant={variant} size={size} icon="arrow-up-right">
                          Browse properties
                        </Button>
                      ))}
                      <Button variant={variant}>Text only</Button>
                      <Button variant={variant} disabled>
                        Disabled
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="relative isolate overflow-hidden rounded-photo">
                  <Image src={PHOTO} alt="" fill sizes="(min-width: 1024px) 80vw, 100vw" className="-z-10 object-cover" />
                  <div className="absolute inset-0 -z-10 bg-night/30" />
                  <div className="flex flex-wrap items-center gap-4 p-10 md:p-16">
                    <span className="w-full text-small text-white/85 md:w-auto md:pr-6">on-image</span>
                    <ButtonLink href="/properties" variant="on-image" size="lg" magnetic>
                      Magnetic hero CTA
                    </ButtonLink>
                    <ButtonLink href="/properties" variant="on-image" icon="arrow-right">
                      See the residence
                    </ButtonLink>
                  </div>
                </div>
              </div>
            </Spec>

            <Spec
              id="fields"
              index={6}
              title="Fields"
              intro="Field wires the label, hint, and error to its control through context, so aria-invalid and aria-describedby are always right. The same zod schema validates here and at the server boundary. Errors fade in beneath the field; edit an invalid field to watch it clear."
            >
              <Panel className="max-w-4xl" coreClassName="md:p-12">
                <InquiryFormDemo />
              </Panel>
            </Spec>

            <Spec
              id="status"
              index={7}
              title="Status"
              intro="StatusPill reads from one lookup table keyed by kind and status, so a new status is a type error until it is given a label and tone."
            >
              <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="w-24 text-small text-ink-muted">Listing</span>
                  {LISTING_STATUSES.map((s) => (
                    <StatusPill key={s} kind="listing" status={s} />
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="w-24 text-small text-ink-muted">Inquiry</span>
                  {INQUIRY_STATUSES.map((s) => (
                    <StatusPill key={s} kind="inquiry" status={s} />
                  ))}
                </div>
              </div>
            </Spec>

            <Spec
              id="panels"
              index={8}
              title="Panels"
              intro="The double bezel: a tinted outer tray holding an inner plate with a concentric radius and a top highlight. Used for filters, forms, dashboard modules, and dialogs. Never around a listing photograph."
            >
              <div className="grid gap-6 md:grid-cols-2">
                <Panel coreClassName="flex flex-col gap-8">
                  <div className="flex items-center justify-between">
                    <span className="text-micro font-medium uppercase text-ink-muted">Inquiries this week</span>
                    <StatusPill kind="inquiry" status="new" />
                  </div>
                  <span className="font-display text-display-2 leading-none">
                    <CountUp value={18} />
                  </span>
                  <p className="text-small text-ink-muted">Six awaiting a first reply. Median response time 3 hours.</p>
                </Panel>
                <Panel tone="night" coreClassName="flex flex-col gap-8">
                  <span className="text-micro font-medium uppercase text-on-night-muted">Portfolio value</span>
                  <span className="font-display text-display-2 leading-none text-on-night">
                    <CountUp value={1_284_000_000} format="php-compact" />
                  </span>
                  <p className="text-small text-on-night-muted">Across 24 published residences in seven cities.</p>
                </Panel>
              </div>
            </Spec>

            <Spec
              id="overlays"
              index={9}
              title="Overlays"
              intro="Dialog and Sheet sit on the native dialog top layer: the page behind becomes inert, Esc and the backdrop close, scroll locks, and focus returns to the opener. Toasts queue at most three and pause while hovered or focused."
            >
              <OverlayDemo />
            </Spec>

            <Spec
              id="loading"
              index={10}
              title="Loading and empty"
              intro="Skeletons echo the final layout exactly and sweep light slowly across sunken paper. Empty states speak plainly and always offer the next step."
            >
              <div className="grid gap-10 md:grid-cols-3">
                <PropertyCardSkeleton />
                <div className="flex flex-col gap-6">
                  <PropertyCardSkeleton variant="compact" />
                  <PropertyCardSkeleton variant="compact" />
                  <Skeleton className="h-24 w-full rounded-[1.25rem]" />
                </div>
                <Panel coreClassName="p-0 md:p-0">
                  <EmptyState
                    icon="favorites"
                    title="Nothing saved yet"
                    action={
                      <ButtonLink href="/properties" variant="secondary" size="sm">
                        Browse residences
                      </ButtonLink>
                    }
                  >
                    Tap the heart on any residence to keep it here.
                  </EmptyState>
                </Panel>
              </div>
            </Spec>

            <Spec
              id="motion"
              index={11}
              title="Motion"
              intro={
                <>
                  Three libraries, three jobs, one set of tokens in <code className="text-small">src/lib/motion.ts</code>. ESLint
                  enforces the split. Everything animates transform, opacity, or clip-path, and every path honours
                  prefers-reduced-motion.
                </>
              }
            >
              <div className="overflow-hidden rounded-[1.25rem] ring-1 ring-ink/10">
                <table className="w-full text-left text-small">
                  <thead className="bg-paper-raised text-micro uppercase text-ink-muted">
                    <tr>
                      <th scope="col" className="px-6 py-4 font-medium">Library</th>
                      <th scope="col" className="px-6 py-4 font-medium">Owns</th>
                      <th scope="col" className="hidden px-6 py-4 font-medium md:table-cell">Primitives</th>
                    </tr>
                  </thead>
                  <tbody>
                    {OWNERSHIP.map((row) => (
                      <tr key={row.library} className="border-t border-ink/10 align-top">
                        <th scope="row" className="px-6 py-5 font-medium">{row.library}</th>
                        <td className="px-6 py-5 text-ink-soft">{row.owns}</td>
                        <td className="hidden px-6 py-5 text-ink-muted md:table-cell">{row.primitives}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-10 grid gap-4 md:grid-cols-3">
                {(Object.keys(ease) as Array<keyof typeof ease>).map((name) => (
                  <div key={name} className="flex flex-col gap-1 rounded-[1rem] bg-paper-raised p-5 text-small ring-1 ring-inset ring-ink/[0.06]">
                    <span className="font-medium">ease-{name}</span>
                    <span className="tabular text-ink-muted">cubic-bezier({ease[name].join(", ")})</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-small text-ink-muted">
                Durations {Object.values(duration).join(" / ")}s. Staggers {Object.values(stagger).join(" / ")}s. Springs carry zero bounce.
              </p>

              <div className="mt-20 grid gap-16 md:grid-cols-2">
                <div className="flex flex-col gap-6">
                  <span className="text-micro font-medium uppercase text-ink-muted">Wordmark · Anime.js stroke draw</span>
                  <WordmarkDemo />
                  <div className="flex items-end gap-8 text-[3rem] text-ink">
                    <Wordmark variant="monogram" />
                    <span className="text-small text-ink-muted">Monogram, for favicons and empty image wells.</span>
                  </div>
                </div>
                <div className="flex flex-col gap-6">
                  <span className="text-micro font-medium uppercase text-ink-muted">SplitHeading · Anime.js word stagger</span>
                  <SplitHeading text="Light falls *slowly* in Tagaytay." className="text-display-3" />
                  <span className="mt-6 text-micro font-medium uppercase text-ink-muted">CountUp · Anime.js</span>
                  <dl className="grid grid-cols-3 gap-6">
                    {[
                      { label: "Residences", node: <CountUp value={248} /> },
                      { label: "Represented", node: <CountUp value={12_400_000_000} format="php-compact" /> },
                      { label: "Repeat clients", node: <CountUp value={64} format="percent" /> },
                    ].map((stat) => (
                      <div key={stat.label} className="flex flex-col gap-1">
                        <dt className="text-small text-ink-muted">{stat.label}</dt>
                        <dd className="font-display text-heading">{stat.node}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              <div className="mt-20 grid gap-6 md:grid-cols-12">
                <div className="flex flex-col gap-3 md:col-span-4">
                  <span className="text-micro font-medium uppercase text-ink-muted">Reveal · Framer whileInView</span>
                  {["Heavy fade-up", "Six pixels of blur", "Staggered by index"].map((label, i) => (
                    <Reveal key={label} index={i} className="rounded-[1rem] bg-paper-raised px-6 py-5 text-small ring-1 ring-inset ring-ink/[0.06]">
                      {label}
                    </Reveal>
                  ))}
                </div>
                <div className="flex flex-col gap-3 md:col-span-8">
                  <span className="text-micro font-medium uppercase text-ink-muted">ScrollImage · GSAP clip reveal and parallax</span>
                  <ScrollImage
                    src={FIXTURE_PROPERTIES[3]?.coverImage?.url ?? PHOTO}
                    alt="A pale modern villa with terraces over a garden pool"
                    sizes="(min-width: 768px) 60vw, 100vw"
                    className="aspect-[16/10] rounded-photo"
                  />
                </div>
              </div>
            </Spec>

            <Spec
              id="cards"
              index={12}
              title="Property cards"
              intro="Three variants of one component. Photography is unboxed with a 3px radius. Hover or focus slowly enlarges the image and lifts a detail bar. The action slot holds the favorite toggle above the card link."
            >
              <div className="flex flex-col gap-24">
                {feature && (
                  <PropertyCard property={feature} variant="feature" priority action={<FavoriteDemo label={feature.title} />} />
                )}
                <div className="grid gap-x-8 gap-y-16 md:grid-cols-2 xl:grid-cols-3">
                  {rest.slice(0, 6).map((p) => (
                    <PropertyCard key={p.id} property={p} action={<FavoriteDemo label={p.title} />} />
                  ))}
                </div>
                <div className="grid gap-12 md:grid-cols-2">
                  <Panel coreClassName="flex flex-col gap-6">
                    <span className="text-micro font-medium uppercase text-ink-muted">Compact · dashboards and lists</span>
                    {FIXTURE_PROPERTIES.slice(5).map((p) => (
                      <PropertyCard key={p.id} property={p} variant="compact" />
                    ))}
                  </Panel>
                  <div className="flex flex-col justify-center gap-6">
                    <span className="text-micro font-medium uppercase text-ink-muted">Price</span>
                    <Price amount={385_000_000} listingType="sale" size="xl" />
                    <Price amount={285_000} listingType="rent" size="lg" />
                    <Price amount={1_250_000_000} listingType="sale" style="compact" size="md" />
                  </div>
                </div>
              </div>
            </Spec>
          </div>
        </Container>
        <div className="h-24" />
      </main>
    </>
  );
}
