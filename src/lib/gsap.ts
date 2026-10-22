"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ease, type EaseName, REDUCED_MOTION_QUERY } from "@/lib/motion";

/**
 * The single place GSAP is imported and its plugins registered. ESLint blocks
 * `gsap` and `@gsap/react` imports anywhere else, so every component gets the
 * same registered instance and the shared eases.
 */
gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase);

for (const name of Object.keys(ease) as EaseName[]) {
  CustomEase.create(name, ease[name].join(","));
}

export const MEDIA = {
  motionOk: "(prefers-reduced-motion: no-preference)",
  reduced: REDUCED_MOTION_QUERY,
  desktop: "(min-width: 768px)",
} as const;

export { gsap, ScrollTrigger, useGSAP };
