"use client";

import { animate, cubicBezier, stagger as animeStagger } from "animejs";
import { Fragment, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { duration, ease, ms, prefersReducedMotion, stagger } from "@/lib/motion";

type Word = { text: string; em: boolean };

/** `Residences of *quiet* consequence` marks "quiet" for the italic accent. */
function parse(text: string): Word[] {
  return text
    .split(/(\*[^*]+\*)/)
    .filter(Boolean)
    .flatMap((chunk) => {
      const em = chunk.startsWith("*") && chunk.endsWith("*");
      return (em ? chunk.slice(1, -1) : chunk)
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => ({ text: word, em }));
    });
}

const TAGS = { h1: "h1", h2: "h2", h3: "h3", p: "p" } as const;

/**
 * Word-by-word rise from behind a mask. The full sentence is in the server
 * HTML and in the heading's accessible name; until JS runs (and always under
 * reduced motion) it simply reads as finished type.
 */
export function SplitHeading({
  as = "h2",
  text,
  trigger = "view",
  delay = 0,
  className,
  emClassName = "italic",
}: {
  as?: keyof typeof TAGS;
  text: string;
  trigger?: "mount" | "view";
  /** Seconds before the first word moves. */
  delay?: number;
  className?: string;
  emClassName?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const words = parse(text);
  const Tag = TAGS[as];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const finish = () => el.setAttribute("data-split", "done");
    if (prefersReducedMotion()) return finish();

    let animation: ReturnType<typeof animate> | undefined;
    const play = () => {
      animation = animate(el.querySelectorAll("[data-split-word]"), {
        translateY: { from: "108%", to: "0%" },
        duration: ms(duration.reveal + 0.2),
        delay: animeStagger(ms(stagger.words), { start: ms(delay) }),
        ease: cubicBezier(...ease.reveal),
        onComplete: finish,
      });
    };

    if (trigger === "mount") {
      play();
      return () => void animation?.revert();
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        play();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      animation?.revert();
    };
  }, [trigger, delay]);

  return (
    <Tag ref={ref} aria-label={words.map((w) => w.text).join(" ")} data-split="pending" className={cn("font-display", className)}>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span aria-hidden className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] pr-[0.08em] -mr-[0.08em] align-top">
            <span data-split-word className={cn("inline-block", word.em && emClassName)}>
              {word.text}
            </span>
          </span>
          {i < words.length - 1 && " "}
        </Fragment>
      ))}
    </Tag>
  );
}
