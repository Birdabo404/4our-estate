import type { Transition } from "framer-motion";

export type CubicBezier = readonly [number, number, number, number];

/**
 * The only easing curves in the product. `globals.css` mirrors these as
 * `--ease-*` theme tokens; `scripts/design/check-tokens.ts` fails if they drift.
 */
export const ease = {
  /** Default for UI state: fast departure, long soft landing. */
  settle: [0.32, 0.72, 0, 1],
  /** Entrances and image reveals: an expo-out that arrives with weight. */
  reveal: [0.16, 1, 0.3, 1],
  /** Exits: gathers speed as it leaves, so dismissal never lingers. */
  exit: [0.55, 0, 0.75, 0.15],
} as const satisfies Record<string, CubicBezier>;

export type EaseName = keyof typeof ease;

export function cssEase(name: EaseName): string {
  return `cubic-bezier(${ease[name].join(", ")})`;
}

/** Seconds, the unit Framer Motion and GSAP share. Anime.js takes `ms()`. */
export const duration = {
  instant: 0.16,
  fast: 0.28,
  base: 0.5,
  slow: 0.9,
  reveal: 1.1,
  cinematic: 1.6,
} as const;

export const stagger = {
  letters: 0.022,
  words: 0.06,
  items: 0.08,
  sections: 0.14,
} as const;

export function ms(seconds: number): number {
  return Math.round(seconds * 1000);
}

/**
 * Framer Motion springs. Every preset has zero or near-zero bounce: the
 * brief forbids anything that reads as playful.
 */
export const spring = {
  /** Hover, toggles, indicators. */
  ui: { type: "spring", visualDuration: 0.42, bounce: 0 },
  /** Press feedback; quick enough to feel physical. */
  press: { type: "spring", visualDuration: 0.18, bounce: 0 },
  /** Panels, sheets, dialogs. */
  panel: { type: "spring", visualDuration: 0.6, bounce: 0.04 },
  /** Magnetic follow; soft so the element feels heavy. */
  magnetic: { type: "spring", stiffness: 160, damping: 18, mass: 0.6 },
} as const satisfies Record<string, Transition>;

export const tween = {
  reveal: { duration: duration.reveal, ease: ease.reveal },
  settle: { duration: duration.base, ease: ease.settle },
  exit: { duration: duration.fast, ease: ease.exit },
} as const satisfies Record<string, Transition>;

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
