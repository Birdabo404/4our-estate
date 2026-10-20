"use client";

import { ArrowLeft, ArrowRight, X } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { spring, tween } from "@/lib/motion";
import type { LightboxState } from "./gallery-state";
import type { GalleryImage } from "./photo-meta";

type LightboxProps = {
  images: readonly GalleryImage[];
  title: string;
  state: LightboxState;
  onShow: (index: number) => void;
  onClose: () => void;
};

export function Lightbox({ state, ...rest }: LightboxProps) {
  return (
    <AnimatePresence>
      {state.kind === "open" && <Surface key="lightbox" index={state.index} source={state.source} {...rest} />}
    </AnimatePresence>
  );
}

const slide: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 56 }),
  center: { opacity: 1, x: 0, transition: spring.panel },
  leave: (direction: number) => ({ opacity: 0, x: direction * -56, transition: tween.exit }),
};

const two = (n: number) => String(n).padStart(2, "0");

function Surface({
  images,
  title,
  index,
  source,
  onShow,
  onClose,
}: Omit<LightboxProps, "state"> & { index: number; source: string | null }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const image = images[index];

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    dialog.showModal();
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
      opener?.focus({ preventScroll: true });
    };
  }, []);

  const show = (next: number, towards: 1 | -1) => {
    setDirection(towards);
    onShow((next + images.length) % images.length);
  };
  const go = (delta: 1 | -1) => show(index + delta, delta);

  if (!image) return null;

  return (
    <dialog
      ref={ref}
      aria-label={`${title}, photograph ${index + 1} of ${images.length}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") go(1);
        if (event.key === "ArrowLeft") go(-1);
      }}
      className="fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden bg-transparent p-0 text-on-night backdrop:bg-transparent"
    >
      <motion.div
        aria-hidden
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: tween.settle }}
        exit={{ opacity: 0, transition: { ...tween.settle, delay: source ? 0.1 : 0 } }}
        className="absolute inset-0 bg-night/[0.97]"
      />

      <div className="pointer-events-none relative flex h-full flex-col">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0, transition: { ...tween.settle, delay: 0.15 } }}
          exit={{ opacity: 0, transition: tween.exit }}
          className="pointer-events-auto flex items-center justify-between gap-6 px-5 pb-3 pt-5 md:px-10 md:pt-7"
        >
          <p className="flex items-baseline gap-4">
            <span className="tabular text-micro font-medium uppercase text-on-night">
              {two(index + 1)} <span className="text-on-night-muted">/ {two(images.length)}</span>
            </span>
            <span className="hidden truncate font-display text-[1.0625rem] [--opsz:11] text-on-night-muted md:inline">{title}</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close photographs"
            className="grid size-11 shrink-0 place-items-center rounded-full ring-1 ring-inset ring-white/25 transition-colors duration-300 ease-settle hover:bg-white/10"
          >
            <X size={16} weight="light" />
          </button>
        </motion.header>

        <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 md:px-28">
          <AnimatePresence initial={false} mode="popLayout" custom={direction}>
            <motion.figure
              key={index}
              custom={direction}
              variants={source ? undefined : slide}
              initial={source ? false : "enter"}
              animate="center"
              exit="leave"
              drag="x"
              dragSnapToOrigin
              dragElastic={0.18}
              onDragEnd={(_, info) => {
                if (info.offset.x < -72) go(1);
                else if (info.offset.x > 72) go(-1);
              }}
              className="pointer-events-auto flex cursor-grab flex-col items-center gap-5 active:cursor-grabbing"
            >
              <motion.div
                layoutId={source ?? undefined}
                transition={spring.panel}
                className="relative overflow-hidden rounded-photo bg-night-raised"
                style={{
                  aspectRatio: image.ratio,
                  width: `min(calc(100vw - 2rem), calc((100dvh - 15rem) * ${image.ratio}))`,
                }}
              >
                <Image src={image.url} alt={image.alt} fill sizes="92vw" draggable={false} className="select-none object-cover" />
              </motion.div>
              <motion.figcaption
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { ...tween.settle, delay: 0.2 } }}
                exit={{ opacity: 0, transition: tween.exit }}
                className="max-w-[60ch] px-2 text-center text-small text-on-night-muted"
              >
                {image.alt}
              </motion.figcaption>
            </motion.figure>
          </AnimatePresence>

          {images.length > 1 && (
            <>
              <StepButton direction={-1} onClick={() => go(-1)} className="left-6 lg:left-10" />
              <StepButton direction={1} onClick={() => go(1)} className="right-6 lg:right-10" />
            </>
          )}
        </div>

        <motion.footer
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { ...tween.settle, delay: 0.2 } }}
          exit={{ opacity: 0, transition: tween.exit }}
          className="pointer-events-auto flex items-center justify-between gap-4 px-5 pb-6 pt-4 md:justify-center md:px-10 md:pb-8"
        >
          <StepButton direction={-1} onClick={() => go(-1)} inline />
          <ol className="hidden items-center gap-2 md:flex" aria-label="All photographs">
            {images.map((thumb, i) => (
              <li key={thumb.id}>
                <button
                  type="button"
                  aria-label={`Photograph ${i + 1}`}
                  aria-current={i === index ? "true" : undefined}
                  onClick={() => i !== index && show(i, i > index ? 1 : -1)}
                  className={cn(
                    "relative block h-12 overflow-hidden rounded-[2px] transition-opacity duration-500 ease-settle",
                    i === index ? "opacity-100 ring-1 ring-on-night ring-offset-2 ring-offset-night" : "opacity-45 hover:opacity-80",
                  )}
                  style={{ aspectRatio: thumb.ratio }}
                >
                  <Image src={thumb.url} alt="" fill sizes="96px" className="object-cover" />
                </button>
              </li>
            ))}
          </ol>
          <StepButton direction={1} onClick={() => go(1)} inline />
        </motion.footer>
      </div>
    </dialog>
  );
}

function StepButton({
  direction,
  onClick,
  inline = false,
  className,
}: {
  direction: 1 | -1;
  onClick: () => void;
  inline?: boolean;
  className?: string;
}) {
  const Glyph = direction === 1 ? ArrowRight : ArrowLeft;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 1 ? "Next photograph" : "Previous photograph"}
      className={cn(
        "pointer-events-auto grid size-12 place-items-center rounded-full ring-1 ring-inset ring-white/25 transition-colors duration-300 ease-settle hover:bg-white/10",
        inline ? "md:hidden" : "absolute top-1/2 hidden -translate-y-1/2 md:grid",
        className,
      )}
    >
      <Glyph size={16} weight="light" />
    </button>
  );
}
