"use client";

import { type ReactNode, useRef } from "react";
import { cn } from "@/lib/cn";
import { gsap, MEDIA, ScrollTrigger, useGSAP } from "@/lib/gsap";

export const PIN_MEDIA = `${MEDIA.motionOk} and (min-width: 1024px)`;

/** A hairline that fills as the pinned track passes. Place it anywhere inside `HorizontalPin`. */
export function PinProgress({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("h-px bg-current/15", className)}>
      <div data-progress className="h-px origin-left scale-x-0 bg-accent" />
    </div>
  );
}

/**
 * On wide screens with motion allowed, pins the section for exactly as long
 * as it takes to pass the track sideways. Everywhere else the track is a
 * native swipe row with snap points, so touch, keyboard, and reduced motion
 * get the same content without the pin. While pinned, the root carries
 * `data-pinned`, so layouts can switch with `group-data-[pinned=true]/pin:`.
 */
export function HorizontalPin({
  header,
  children,
  className,
  viewportClassName,
  trackClassName,
}: {
  header: ReactNode;
  /** List items; the track is a `<ul>`. */
  children: ReactNode;
  className?: string;
  viewportClassName?: string;
  trackClassName?: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      const track = el?.querySelector<HTMLElement>("[data-track]");
      const progress = el?.querySelectorAll<HTMLElement>("[data-progress]");
      if (!el || !track) return;

      const mm = gsap.matchMedia();
      mm.add(PIN_MEDIA, () => {
        el.dataset.pinned = "true";
        const viewport = track.parentElement ?? track;
        const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
        timeline.to(track, { x: () => -distance(), ease: "none" }, 0);
        if (progress?.length) timeline.fromTo(progress, { scaleX: 0 }, { scaleX: 1, ease: "none" }, 0);
        void document.fonts.ready.then(() => ScrollTrigger.refresh());
        return () => {
          delete el.dataset.pinned;
        };
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className={cn("group/pin relative overflow-hidden", className)}>
      {header}
      <div className={cn("min-w-0 group-data-[pinned=true]/pin:overflow-hidden", viewportClassName)}>
        <ul
          data-track
          className={cn(
            "flex w-full snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain [scrollbar-width:none] md:gap-6",
            "group-data-[pinned=true]/pin:w-max group-data-[pinned=true]/pin:snap-none group-data-[pinned=true]/pin:overflow-visible group-data-[pinned=true]/pin:will-change-transform",
            trackClassName,
          )}
        >
          {children}
        </ul>
      </div>
    </div>
  );
}
