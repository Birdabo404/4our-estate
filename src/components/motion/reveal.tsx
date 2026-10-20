"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { duration, ease, stagger } from "@/lib/motion";

const TAGS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  li: motion.li,
  p: motion.p,
  span: motion.span,
  header: motion.header,
} as const;

/**
 * A heavy fade-up with a trace of blur, once, as the block enters view.
 * `index` staggers siblings without a wrapper. The blur is the one filter
 * animation allowed in the system: small radius, ordinary blocks only, never
 * on photography.
 */
export function Reveal({
  as = "div",
  index = 0,
  delay = 0,
  distance = 40,
  className,
  children,
}: {
  as?: keyof typeof TAGS;
  index?: number;
  delay?: number;
  distance?: number;
  className?: string;
  children: ReactNode;
}) {
  const Tag = TAGS[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: distance, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.25, margin: "0px 0px -8% 0px" }}
      transition={{ duration: duration.reveal, ease: ease.reveal, delay: delay + index * stagger.items }}
    >
      {children}
    </Tag>
  );
}
