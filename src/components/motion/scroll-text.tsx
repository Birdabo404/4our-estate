"use client";

import { Fragment, useRef } from "react";
import { gsap, MEDIA, useGSAP } from "@/lib/gsap";

const TAGS = { p: "p", h2: "h2" } as const;

type Segment = { text: string; em: boolean };

function parse(text: string): Segment[][] {
  let em = false;
  return text
    .trim()
    .split(/\s+/)
    .map((token) => {
      const segments: Segment[] = [];
      for (const part of token.split(/(\*)/)) {
        if (part === "*") em = !em;
        else if (part) segments.push({ text: part, em });
      }
      return segments;
    });
}

/**
 * A statement that reads itself in as you scroll: each word lifts from a dim
 * ink to full ink, tied to scroll position so the reader sets the pace. The
 * text is complete in the server HTML; under reduced motion it never dims.
 * `*word*` marks an italic accent, as in `SplitHeading`.
 */
export function ScrollText({
  as = "p",
  text,
  className,
  emClassName = "italic text-accent",
}: {
  as?: keyof typeof TAGS;
  text: string;
  className?: string;
  emClassName?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const Tag = TAGS[as];
  const words = parse(text);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motionOk, () => {
        gsap.fromTo(
          "[data-word]",
          { opacity: 0.16 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.08,
            scrollTrigger: { trigger: ref.current, start: "top 78%", end: "bottom 42%", scrub: 0.6 },
          },
        );
      });
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className}>
      {words.map((parts, i) => (
        <Fragment key={i}>
          <span data-word className="inline-block">
            {parts.map((part, j) =>
              part.em ? (
                <em key={j} className={emClassName}>
                  {part.text}
                </em>
              ) : (
                <Fragment key={j}>{part.text}</Fragment>
              ),
            )}
          </span>{" "}
        </Fragment>
      ))}
    </Tag>
  );
}
