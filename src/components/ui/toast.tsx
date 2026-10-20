"use client";

import { X } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion } from "framer-motion";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { cn } from "@/lib/cn";
import { spring, tween } from "@/lib/motion";

export type ToastTone = "neutral" | "positive" | "danger";

export type ToastInput = { title: string; description?: string; tone?: ToastTone };

type ToastItem = Required<Pick<ToastInput, "title" | "tone">> & { id: number; description?: string };

type Action = { type: "push"; toast: ToastItem } | { type: "dismiss"; id: number };

const MAX_VISIBLE = 3;
const LIFETIME_MS = 5200;

function reducer(state: ToastItem[], action: Action): ToastItem[] {
  switch (action.type) {
    case "push":
      return [...state, action.toast].slice(-MAX_VISIBLE);
    case "dismiss":
      return state.filter((t) => t.id !== action.id);
    default: {
      const unhandled: never = action;
      return unhandled;
    }
  }
}

const TONE_DOT: Record<ToastTone, string> = {
  neutral: "bg-on-night-muted",
  positive: "bg-[#9fb397]",
  danger: "bg-[#e08f7a]",
};

type ToastApi = { toast: (input: ToastInput) => void; dismiss: (id: number) => void };

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast must be used inside <ToastProvider>");
  return api;
}

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, []);
  const dismiss = useCallback((id: number) => dispatch({ type: "dismiss", id }), []);
  const toast = useCallback(
    ({ title, description, tone = "neutral" }: ToastInput) =>
      dispatch({ type: "push", toast: { id: nextId++, title, description, tone } }),
    [],
  );
  const api = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <section
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-(--z-toast) flex justify-center p-4 sm:justify-end sm:p-6"
      >
        <ol aria-live="polite" className="flex w-full max-w-sm flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {toasts.map((t) => (
              <Toast key={t.id} toast={t} onDismiss={dismiss} />
            ))}
          </AnimatePresence>
        </ol>
      </section>
    </ToastContext.Provider>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => onDismiss(toast.id), LIFETIME_MS);
    return () => window.clearTimeout(timer);
  }, [paused, toast.id, onDismiss]);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: spring.panel }}
      exit={{ opacity: 0, scale: 0.96, transition: tween.exit }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="pointer-events-auto flex items-start gap-4 rounded-[1.25rem] bg-night px-5 py-4 text-on-night shadow-float ring-1 ring-white/10"
    >
      <span aria-hidden className={cn("mt-2 size-1.5 shrink-0 rounded-full", TONE_DOT[toast.tone])} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-small font-medium">{toast.title}</p>
        {toast.description && <p className="text-small text-on-night-muted">{toast.description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="-mr-1 grid size-7 shrink-0 place-items-center rounded-full text-on-night-muted transition-colors duration-300 ease-settle hover:bg-white/10 hover:text-on-night"
      >
        <X size={13} weight="light" />
      </button>
    </motion.li>
  );
}
