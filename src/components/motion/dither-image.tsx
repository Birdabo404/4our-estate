"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/** 8×8 Bayer threshold map, normalised to 0–1. */
const BAYER = (() => {
  const size = 8;
  const map = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v = 0;
      for (let bit = 0, xb = x, yb = y; bit < 3; bit++, xb >>= 1, yb >>= 1) {
        v = (v << 2) | (((xb & 1) ^ (yb & 1)) << 1) | (yb & 1);
      }
      map[y * size + x] = (v + 0.5) / (size * size);
    }
  }
  return map;
})();

function rgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Same-origin source for the canvas: the Next image optimiser re-serves the
 * photo from this host, so reading its pixels never taints the canvas.
 */
function optimised(src: string): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=640&q=75`;
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, w, h);
}

function dither(canvas: HTMLCanvasElement, img: HTMLImageElement, cell: number, ink: string, paper: string, contrast: number) {
  const box = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(box.width / cell));
  const h = Math.max(1, Math.round(box.height / cell));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  drawCover(ctx, img, w, h);
  const frame = ctx.getImageData(0, 0, w, h);
  const px = frame.data;
  const [ir, ig, ib] = rgb(ink);
  const [pr, pg, pb] = rgb(paper);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const lum = (0.2126 * px[i]! + 0.7152 * px[i + 1]! + 0.0722 * px[i + 2]!) / 255;
      const tuned = Math.min(1, Math.max(0, (lum - 0.5) * contrast + 0.5));
      const light = tuned > BAYER[(y & 7) * 8 + (x & 7)]!;
      px[i] = light ? pr : ir;
      px[i + 1] = light ? pg : ig;
      px[i + 2] = light ? pb : ib;
      px[i + 3] = 255;
    }
  }
  ctx.putImageData(frame, 0, 0);
}

export type DitherReveal = "hover" | "fade-top" | "always";

/**
 * A photograph rendered through an ordered dither in two brand colours.
 * `hover` swaps to the real photo on hover or focus within the nearest
 * `.group`; `fade-top` keeps the photo below and lets it dissolve into dots
 * toward the top edge; `always` stays dithered.
 */
export function DitherImage({
  src,
  alt,
  sizes,
  reveal = "hover",
  ink = "#151411",
  paper = "#cfe9f1",
  cell = 3,
  contrast = 1.25,
  preload = false,
  className,
  imageClassName,
}: {
  src: string;
  alt: string;
  sizes: string;
  reveal?: DitherReveal;
  ink?: string;
  paper?: string;
  /** CSS pixels per dither dot. */
  cell?: number;
  contrast?: number;
  preload?: boolean;
  className?: string;
  imageClassName?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let cancelled = false;
    let frame = 0;
    const img = new window.Image();
    img.decoding = "async";
    const paint = () => {
      if (cancelled || !img.complete || img.naturalWidth === 0) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        dither(el, img, cell, ink, paper, contrast);
        el.dataset.ready = "true";
      });
    };
    img.onload = paint;
    img.src = optimised(src);
    const observer = new ResizeObserver(paint);
    observer.observe(el);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [src, cell, ink, paper, contrast]);

  return (
    <div className={cn("relative overflow-hidden", className)} style={{ backgroundColor: paper }}>
      <Image src={src} alt={alt} fill sizes={sizes} preload={preload} className={cn("object-cover", imageClassName)} />
      <canvas
        ref={canvas}
        aria-hidden
        data-reveal={reveal}
        className={cn(
          "absolute inset-0 size-full opacity-0 [image-rendering:pixelated] data-[ready=true]:opacity-100",
          "transition-opacity duration-500 ease-settle",
          reveal === "hover" &&
            "data-[ready=true]:group-hover:opacity-0 data-[ready=true]:group-focus-visible:opacity-0 data-[ready=true]:group-focus-within:opacity-0 pointer-coarse:[mask-image:linear-gradient(180deg,#000_0%,#000_18%,transparent_55%)]",
          reveal === "fade-top" && "[mask-image:linear-gradient(180deg,#000_0%,#000_22%,transparent_62%)]",
        )}
      />
    </div>
  );
}
