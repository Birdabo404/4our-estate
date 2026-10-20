"use client";

import Image from "next/image";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { gsap, MEDIA, useGSAP } from "@/lib/gsap";
import { duration } from "@/lib/motion";

export type ScrollImageIntensity = "subtle" | "hero";

/**
 * `hero` sits above the fold, so it settles in on load instead of waiting for
 * a clip reveal, then drifts slower than the page as you scroll away.
 */
const INTENSITY: Record<
  ScrollImageIntensity,
  { clipFrom: string | null; introScale: number; driftFrom: number; driftTo: number; start: string }
> = {
  subtle: { clipFrom: "inset(14% 9% 14% 9%)", introScale: 1.18, driftFrom: -6, driftTo: 6, start: "top bottom" },
  hero: { clipFrom: null, introScale: 1.1, driftFrom: 0, driftTo: 14, start: "top top" },
};

export function ScrollImage({
  src,
  alt,
  sizes,
  preload = false,
  intensity = "subtle",
  className,
  imageClassName,
}: {
  src: string;
  alt: string;
  sizes: string;
  preload?: boolean;
  intensity?: ScrollImageIntensity;
  className?: string;
  imageClassName?: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const spec = INTENSITY[intensity];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motionOk, () => {
        const scrollTrigger = { trigger: frame.current, start: "top 82%", once: true };
        if (spec.clipFrom) {
          gsap.fromTo(
            frame.current,
            { clipPath: spec.clipFrom },
            { clipPath: "inset(0% 0% 0% 0%)", duration: duration.cinematic, ease: "reveal", scrollTrigger },
          );
        }
        gsap.fromTo(
          "[data-media]",
          { scale: spec.introScale },
          {
            scale: 1,
            duration: duration.cinematic + 0.4,
            ease: "reveal",
            scrollTrigger: spec.clipFrom ? scrollTrigger : undefined,
          },
        );
        gsap.fromTo(
          "[data-drift]",
          { yPercent: spec.driftFrom },
          {
            yPercent: spec.driftTo,
            ease: "none",
            scrollTrigger: { trigger: frame.current, start: spec.start, end: "bottom top", scrub: 0.6 },
          },
        );
      });
    },
    { scope: frame },
  );

  return (
    <div ref={frame} className={cn("relative overflow-hidden bg-paper-sunken", className)}>
      <div data-drift className="absolute inset-x-0 -inset-y-[8%] will-change-transform">
        <div data-media className="absolute inset-0 will-change-transform">
          <Image src={src} alt={alt} fill sizes={sizes} preload={preload} className={cn("object-cover", imageClassName)} />
        </div>
      </div>
    </div>
  );
}
