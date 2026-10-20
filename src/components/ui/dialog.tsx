"use client";

import { X } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion, type TargetAndTransition } from "framer-motion";
import { type ReactNode, useEffect, useId, useRef } from "react";
import { cn } from "@/lib/cn";
import { spring, tween } from "@/lib/motion";

type Placement = "center" | "right" | "bottom";

const PLACEMENT: Record<
  Placement,
  { frame: string; panel: string; initial: TargetAndTransition; animate: TargetAndTransition; exit: TargetAndTransition }
> = {
  center: {
    frame: "items-center justify-center p-4 sm:p-8",
    panel: "w-full max-w-lg rounded-panel",
    initial: { opacity: 0, y: 28, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1, transition: spring.panel },
    exit: { opacity: 0, y: 12, scale: 0.98, transition: tween.exit },
  },
  right: {
    frame: "items-stretch justify-end p-2 sm:p-3",
    panel: "h-full w-full max-w-[30rem] rounded-panel",
    initial: { x: "104%" },
    animate: { x: 0, transition: spring.panel },
    exit: { x: "104%", transition: tween.exit },
  },
  bottom: {
    frame: "items-end justify-center p-2",
    panel: "max-h-[88dvh] w-full max-w-2xl rounded-panel",
    initial: { y: "104%" },
    animate: { y: 0, transition: spring.panel },
    exit: { y: "104%", transition: tween.exit },
  },
};

type LayerProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

function Surface({ onClose, title, description, children, footer, className, placement }: Omit<LayerProps, "open"> & { placement: Placement }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const spec = PLACEMENT[placement];

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
      opener?.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden bg-transparent p-0 backdrop:bg-transparent"
    >
      <motion.div
        aria-hidden
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: tween.settle }}
        exit={{ opacity: 0, transition: tween.exit }}
        className="absolute inset-0 bg-night/45 backdrop-blur-[6px]"
      />
      <div className={cn("pointer-events-none absolute inset-0 flex", spec.frame)}>
        <motion.div
          initial={spec.initial}
          animate={spec.animate}
          exit={spec.exit}
          className={cn(
            "pointer-events-auto flex flex-col overflow-hidden bg-paper-raised shadow-float ring-1 ring-ink/10",
            spec.panel,
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-paper-raised">
            <header className="flex items-start justify-between gap-6 px-7 pb-2 pt-7 md:px-9 md:pt-9">
              <div className="flex flex-col gap-2">
                <h2 id={titleId} className="font-display text-heading">
                  {title}
                </h2>
                {description && (
                  <p id={descriptionId} className="text-small text-ink-muted">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-2 -mt-1 grid size-10 shrink-0 place-items-center rounded-md text-ink-soft ring-1 ring-inset ring-ink/15 transition-colors duration-300 ease-settle hover:bg-ink hover:text-paper"
              >
                <X size={16} weight="regular" />
              </button>
            </header>
            {children && <div className={cn("flex-1 px-7 py-5 md:px-9", className)}>{children}</div>}
            {footer && <footer className="flex flex-wrap items-center justify-end gap-3 px-7 pb-7 pt-3 md:px-9 md:pb-9">{footer}</footer>}
          </div>
        </motion.div>
      </div>
    </dialog>
  );
}

/**
 * Modal dialog on the native `<dialog>` top layer: the page behind is inert,
 * Esc and backdrop clicks close, focus returns to the opener, and the
 * document scroll is locked while it is open.
 */
export function Dialog({ open, ...rest }: LayerProps) {
  return <AnimatePresence>{open && <Surface placement="center" {...rest} />}</AnimatePresence>;
}

export function Sheet({ open, side = "right", ...rest }: LayerProps & { side?: "right" | "bottom" }) {
  return <AnimatePresence>{open && <Surface placement={side} {...rest} />}</AnimatePresence>;
}
