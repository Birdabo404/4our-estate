"use client";

import { createTimeline, cubicBezier, stagger as animeStagger, svg, utils } from "animejs";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { ease, ms, prefersReducedMotion } from "@/lib/motion";

/**
 * The 4OUR mark, drawn as one hairline. The 4's crossbar height carries on as
 * a horizon through the O: a sun on the water line, the Manila Bay sunset
 * every Filipino knows. Letters draw in order, the horizon last.
 */
const LETTERS = [
  "M22 38V2L2 26.5h28",
  "M56 2a18 18 0 1 1 0 36a18 18 0 1 1 0-36",
  "M84 2v23a11 11 0 0 0 22 0V2",
  "M118 38V2h12a9 9 0 0 1 0 18h-12M128.5 20L140 38",
] as const;
const HORIZON = "M38.6 26.5h34.8";

const MONOGRAM_RING = "M20 1.5a18.5 18.5 0 1 1 0 37a18.5 18.5 0 1 1 0-37";
const MONOGRAM_FOUR = "M23.5 30V9.5L12 24.5h16.5";

export type WordmarkVariant = "full" | "monogram";

export function Wordmark({
  variant = "full",
  animated = false,
  label = true,
  className,
}: {
  variant?: WordmarkVariant;
  /** Draws the strokes on first mount. Use once per page, in the chrome. */
  animated?: boolean;
  /** Shows "Estate" beside the full mark. */
  label?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || !animated) return;
    const done = () => root.setAttribute("data-draw", "done");
    if (prefersReducedMotion()) return done();

    const strokes = svg.createDrawable(root.querySelectorAll("[data-stroke]"));
    const horizon = svg.createDrawable(root.querySelectorAll("[data-horizon]"));
    const tag = root.querySelector("[data-tag]");
    utils.set([...strokes, ...horizon], { draw: "0 0" });
    if (tag) utils.set(tag, { opacity: 0 });
    done();

    const timeline = createTimeline({ defaults: { ease: cubicBezier(...ease.settle) } });
    timeline.add(strokes, { draw: "0 1", duration: ms(1.5), delay: animeStagger(ms(0.14)) }, 0);
    if (horizon.length) timeline.add(horizon, { draw: { from: "0.5 0.5", to: "0 1" }, duration: ms(0.9) }, ms(0.75));
    if (tag) timeline.add(tag, { opacity: 1, translateX: { from: -6, to: 0 }, duration: ms(0.9) }, ms(0.9));

    return () => void timeline.revert();
  }, [animated]);

  const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "butt" as const,
    strokeLinejoin: "miter" as const,
    vectorEffect: "non-scaling-stroke" as const,
  };

  return (
    <span
      ref={ref}
      role="img"
      aria-label="4OUR Estate"
      data-draw={animated ? "pending" : "done"}
      className={cn("inline-flex items-end gap-3 leading-none", className)}
    >
      {variant === "full" ? (
        <>
          <svg viewBox="-1 0 143 40" aria-hidden className="h-[1em] w-auto overflow-visible">
            {LETTERS.map((d) => (
              <path key={d} d={d} data-stroke {...stroke} />
            ))}
            <path d={HORIZON} data-horizon {...stroke} strokeWidth={1} />
          </svg>
          {label && (
            <span data-tag className="pb-[0.04em] font-sans text-[0.28em] font-medium uppercase tracking-[0.42em]">
              Estate
            </span>
          )}
        </>
      ) : (
        <svg viewBox="0 0 40 40" aria-hidden className="h-[1em] w-auto overflow-visible">
          <path d={MONOGRAM_RING} data-stroke {...stroke} />
          <path d={MONOGRAM_FOUR} data-stroke {...stroke} />
        </svg>
      )}
    </span>
  );
}
