"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { tween } from "@/lib/motion";

/**
 * `reducedMotion="user"` makes every Framer animation in the tree drop
 * transforms and layout motion when the OS asks for less, keeping opacity
 * only. GSAP and Anime.js primitives gate themselves on the same query.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={tween.settle}>
      <ToastProvider>{children}</ToastProvider>
    </MotionConfig>
  );
}
