"use client";

import { animate, cubicBezier } from "animejs";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { formatPhp } from "@/lib/format";
import { ease, ms, prefersReducedMotion } from "@/lib/motion";

const GROUPED = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 });

/** Named so Server Components can choose a format without passing a function. */
export const COUNT_FORMATS = {
  integer: (n: number) => GROUPED.format(Math.round(n)),
  "php-compact": (n: number) => formatPhp(n, "compact"),
  percent: (n: number) => `${Math.round(n)}%`,
  "plus-integer": (n: number) => `${GROUPED.format(Math.round(n))}+`,
} as const satisfies Record<string, (n: number) => string>;

export type CountFormat = keyof typeof COUNT_FORMATS;

/**
 * Counts from zero when it first enters view. The final value is server
 * rendered and exposed to assistive tech; only the visual digits animate.
 */
export function CountUp({
  value,
  format = "integer",
  seconds = 2.2,
  className,
}: {
  value: number;
  format?: CountFormat;
  seconds?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = COUNT_FORMATS[format];
  const final = fmt(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const state = { n: 0 };
    let animation: ReturnType<typeof animate> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        animation = animate(state, {
          n: value,
          duration: ms(seconds),
          ease: cubicBezier(...ease.reveal),
          onUpdate: () => {
            el.textContent = COUNT_FORMATS[format](state.n);
          },
        });
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      animation?.cancel();
      el.textContent = COUNT_FORMATS[format](value);
    };
  }, [value, format, seconds]);

  return (
    <span className={cn("tabular", className)}>
      <span className="sr-only">{final}</span>
      <span ref={ref} aria-hidden>
        {final}
      </span>
    </span>
  );
}
