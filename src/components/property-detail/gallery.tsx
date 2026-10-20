"use client";

import { ArrowsOut } from "@phosphor-icons/react/ssr";
import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import { type CSSProperties, type ReactNode, useRef } from "react";
import { ScrollImage } from "@/components/motion/scroll-image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { gsap, MEDIA, useGSAP } from "@/lib/gsap";
import { duration, spring } from "@/lib/motion";
import { isHiddenSource, useGallery } from "./gallery-state";
import type { GalleryImage, GalleryRow } from "./photo-meta";

export function GalleryHero({ children }: { children: ReactNode }) {
  const { images } = useGallery();
  const cover = images[0];
  return (
    <section data-nav-surface="image" className="relative isolate flex min-h-[92dvh] flex-col justify-end overflow-hidden bg-night text-white">
      {cover && (
        <ScrollImage src={cover.url} alt={cover.alt} sizes="100vw" preload intensity="hero" className="absolute inset-0 -z-10" />
      )}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(20_18_15/0.5)_0%,rgb(20_18_15/0)_24%,rgb(20_18_15/0.06)_52%,rgb(20_18_15/0.78)_100%)]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_55%_at_0%_100%,rgb(20_18_15/0.55),rgb(20_18_15/0))]" />
      {children}
    </section>
  );
}

export function OpenGalleryButton() {
  const { images, open } = useGallery();
  if (images.length === 0) return null;
  return (
    <Button variant="on-image" icon="arrow-up-right" onClick={() => open(0, null)}>
      View {images.length} photographs
    </Button>
  );
}

const hint: Variants = {
  rest: { opacity: 0, y: 6 },
  hover: { opacity: 1, y: 0, transition: spring.ui },
};

function Frame({
  image,
  index,
  layoutId,
  sizes,
  className,
  style,
}: {
  image: GalleryImage;
  index: number;
  layoutId: string | null;
  sizes: string;
  className?: string;
  style?: CSSProperties;
}) {
  const { state, open } = useGallery();
  const hidden = layoutId !== null && isHiddenSource(state, layoutId);
  return (
    <motion.button
      type="button"
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileFocus="hover"
      onClick={() => open(index, layoutId)}
      aria-label={`Open photograph ${index + 1}: ${image.alt}`}
      className={cn("relative block shrink-0 cursor-zoom-in rounded-photo bg-paper-sunken", className)}
      style={{ aspectRatio: image.ratio, ...style }}
    >
      {!hidden && (
        <motion.div layoutId={layoutId ?? undefined} transition={spring.panel} className="absolute inset-0 overflow-hidden rounded-photo">
          <div data-reveal className="absolute inset-0 overflow-hidden">
            <div data-zoom className="absolute inset-0 will-change-transform">
              <Image src={image.url} alt="" fill sizes={sizes} className="object-cover" />
            </div>
          </div>
        </motion.div>
      )}
      <motion.span
        aria-hidden
        variants={hint}
        className="absolute bottom-4 right-4 grid size-10 place-items-center rounded-full bg-paper text-ink shadow-float"
      >
        <ArrowsOut size={15} weight="light" />
      </motion.span>
    </motion.button>
  );
}

const ROW_SIZES = "(min-width: 1024px) 55vw, 100vw";
const PAIR_SIZES = "(min-width: 1024px) 28vw, 50vw";

export function GalleryColumn({ rows, className }: { rows: readonly GalleryRow[]; className?: string }) {
  const { images } = useGallery();
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${MEDIA.motionOk} and ${MEDIA.desktop}`, () => {
        for (const frame of gsap.utils.toArray<HTMLElement>("[data-rows] [data-reveal]")) {
          const timeline = gsap.timeline({ scrollTrigger: { trigger: frame, start: "top 88%", once: true } });
          timeline
            .fromTo(frame, { clipPath: "inset(10% 7% 10% 7%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: duration.cinematic, ease: "reveal" }, 0)
            .fromTo(frame.querySelector("[data-zoom]"), { scale: 1.14 }, { scale: 1, duration: duration.cinematic + 0.4, ease: "reveal" }, 0);
        }
      });
    },
    { scope: root },
  );

  if (images.length < 2) return null;

  return (
    <div ref={root} className={className}>
      <div data-rows className="hidden flex-col gap-4 md:flex lg:gap-5">
        {rows.map((row) => {
          switch (row.kind) {
            case "wide":
              return <Frame key={row.image.id} image={row.image} index={row.index} layoutId={`frame-${row.index}`} sizes={ROW_SIZES} className="w-full" />;
            case "pair":
              return (
                <div key={row.images[0].id} className="flex gap-4 lg:gap-5">
                  {row.images.map((image, i) => (
                    <Frame
                      key={image.id}
                      image={image}
                      index={row.indexes[i]}
                      layoutId={`frame-${row.indexes[i]}`}
                      sizes={PAIR_SIZES}
                      style={{ flex: `${image.ratio} 1 0%` }}
                    />
                  ))}
                </div>
              );
            case "single":
              return (
                <Frame
                  key={row.image.id}
                  image={row.image}
                  index={row.index}
                  layoutId={`frame-${row.index}`}
                  sizes={PAIR_SIZES}
                  className={cn("w-[62%]", row.align === "end" ? "self-end" : "self-start")}
                />
              );
            default: {
              const unhandled: never = row;
              return unhandled;
            }
          }
        })}
      </div>

      <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-2 [scrollbar-width:none] sm:-mx-8 sm:scroll-px-8 sm:px-8 md:hidden">
        {images.slice(1).map((image, i) => (
          <Frame key={image.id} image={image} index={i + 1} layoutId={null} sizes="80vw" className="h-[68vw] max-h-[26rem] snap-start" />
        ))}
      </div>
    </div>
  );
}
