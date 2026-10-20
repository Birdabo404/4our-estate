"use client";

import { HeartStraight } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { duration, ease, spring } from "@/lib/motion";
import { useFavorites } from "./favorites-provider";

export type FavoriteButtonTone = "image" | "paper";

const TONE: Record<FavoriteButtonTone, { shell: string; glyph: string }> = {
  image: {
    shell: "size-10 bg-paper/92 text-ink shadow-lift ring-1 ring-inset ring-white/50 hover:bg-white",
    glyph: "size-[18px]",
  },
  paper: {
    shell: "h-11 gap-2.5 pl-3.5 pr-4.5 text-small text-ink ring-1 ring-inset ring-ink/15 hover:bg-ink/[0.04] hover:ring-ink/30",
    glyph: "size-[18px]",
  },
};

export function FavoriteButton({
  propertyId,
  title,
  tone = "image",
  className,
}: {
  propertyId: string;
  title: string;
  tone?: FavoriteButtonTone;
  className?: string;
}) {
  const { isFavorite, toggle } = useFavorites();
  const saved = isFavorite(propertyId);
  const [pulse, setPulse] = useState(0);
  const spec = TONE[tone];

  return (
    <motion.button
      type="button"
      aria-pressed={saved}
      aria-label={tone === "image" ? (saved ? `Remove ${title} from saved` : `Save ${title}`) : undefined}
      onClick={() => {
        if (!saved) setPulse((n) => n + 1);
        toggle(propertyId);
      }}
      whileTap={{ scale: 0.92 }}
      transition={spring.press}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full font-medium transition-[background-color,box-shadow] duration-500 ease-settle",
        spec.shell,
        className,
      )}
    >
      <span aria-hidden className={cn("relative grid place-items-center", spec.glyph)}>
        <HeartStraight weight="light" className="absolute inset-0 size-full" />
        <motion.span
          className="absolute inset-0 text-accent"
          initial={false}
          animate={saved ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.55 }}
          transition={spring.ui}
        >
          <HeartStraight weight="fill" className="size-full" />
        </motion.span>
        <AnimatePresence>
          {pulse > 0 && saved && (
            <motion.span
              key={pulse}
              className="absolute -inset-2 rounded-full ring-1 ring-accent/50"
              initial={{ opacity: 0.9, scale: 0.6 }}
              animate={{ opacity: 0, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.slow, ease: ease.reveal }}
            />
          )}
        </AnimatePresence>
      </span>
      {tone === "paper" && <span>{saved ? "Saved" : "Save"}</span>}
    </motion.button>
  );
}
