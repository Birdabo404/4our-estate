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
    shell: "size-9 rounded-md bg-white text-ink ring-1 ring-inset ring-ink/10 hover:bg-sky",
    glyph: "size-[18px]",
  },
  paper: {
    shell: "h-11 gap-2.5 rounded-md pl-3.5 pr-4.5 text-small text-ink ring-1 ring-inset ring-ink/20 hover:ring-ink",
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
        "relative inline-flex shrink-0 items-center justify-center font-semibold transition-[background-color,box-shadow] duration-500 ease-settle",
        spec.shell,
        className,
      )}
    >
      <span aria-hidden className={cn("relative grid place-items-center", spec.glyph)}>
        <HeartStraight weight="regular" className="absolute inset-0 size-full" />
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
              className="absolute -inset-2 rounded-md ring-2 ring-accent/60"
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
