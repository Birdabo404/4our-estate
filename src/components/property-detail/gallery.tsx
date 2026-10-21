"use client";

import { ArrowsOut } from "@phosphor-icons/react/ssr";
import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import { type CSSProperties, type ReactNode, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { gsap, MEDIA, useGSAP } from "@/lib/gsap";
import { duration, spring } from "@/lib/motion";
import { isHiddenSource, useGallery } from "./gallery-state";
import type { GalleryImage, GalleryRow } from "./photo-meta";

const MOSAIC_LEAD = "(min-width: 1024px) 66vw, 100vw";
const MOSAIC_SIDE = "(min-width: 1024px) 30vw, 50vw";

/** Sky header with the title block and a three-photo mosaic. The mosaic owns photos 0–2; the column starts at 3. */
export function GalleryHero({ children }: { children: ReactNode }) {
  const { images } = useGallery();
  const [cover, ...rest] = images;
  const side = rest.slice(0, 2);
  return (
    <section className="relative isolate overflow-hidden bg-sky pb-8 pt-[calc(var(--nav-height)+2rem)] md:pb-12 md:pt-[calc(var(--nav-height)+3rem)]">
      <div aria-hidden className="bg-grid absolute inset-0 -z-10 [mask-image:linear-gradient(180deg,#000_10%,transparent_70%)]" />
      {children}
      {cover && (
        <div className="mx-auto mt-8 w-full max-w-[96rem] px-5 sm:px-8 md:mt-10 lg:px-12">
          <div className="relative grid h-[min(68vw,22rem)] gap-2 sm:h-[26rem] md:gap-3 lg:h-[34rem] lg:grid-cols-3 lg:grid-rows-2">
            <Frame
              image={cover}
              index={0}
              layoutId="frame-0"
              sizes={MOSAIC_LEAD}
              preload
              className={cn("h-full w-full", side.length > 0 ? "lg:col-span-2 lg:row-span-2" : "lg:col-span-3 lg:row-span-2")}
              style={{ aspectRatio: "auto" }}
            />
            {side.map((image, i) => (
              <Frame
                key={image.id}
                image={image}
                index={i + 1}
                layoutId={`frame-${i + 1}`}
                sizes={MOSAIC_SIDE}
                className={cn("hidden h-full w-full lg:block", side.length === 1 && "lg:row-span-2")}
                style={{ aspectRatio: "auto" }}
              />
            ))}
            <div className="pointer-events-none absolute bottom-3 left-3 md:bottom-4 md:left-4">
              <div className="pointer-events-auto">
                <OpenGalleryButton />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function OpenGalleryButton() {
  const { images, open } = useGallery();
  if (images.length === 0) return null;
  return (
    <Button variant="on-image" size="sm" icon="arrow-up-right" onClick={() => open(0, null)}>
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
  preload = false,
  className,
  style,
}: {
  image: GalleryImage;
  index: number;
  layoutId: string | null;
  sizes: string;
  preload?: boolean;
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
              <Image src={image.url} alt="" fill sizes={sizes} preload={preload} className="object-cover" />
            </div>
          </div>
        </motion.div>
      )}
      <motion.span
        aria-hidden
        variants={hint}
        className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-md bg-paper-raised text-ink shadow-float"
      >
        <ArrowsOut size={15} weight="bold" />
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
      if (!root.current) return;
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
