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
 * A short fade-up, once, as the block enters view. `index` staggers siblings
 * without a wrapper. Kept small on purpose: content should arrive, not perform.
 */
export function Reveal({
  as = "div",
  index = 0,
  delay = 0,
  distance = 14,
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
      initial={{ opacity: 0, y: Math.min(distance, 18) }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2, margin: "0px 0px -6% 0px" }}
      transition={{ duration: duration.slow, ease: ease.reveal, delay: delay + index * (stagger.items / 2) }}
    >
      {children}
    </Tag>
  );
}
