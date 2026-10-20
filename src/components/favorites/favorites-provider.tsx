"use client";

import { X } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { useToast } from "@/components/ui/toast";
import { spring, tween } from "@/lib/motion";
import {
  guestPromptDismissed,
  guestPromptShown,
  hydrated,
  isFavorite as favoriteFlag,
  toggleFavorite,
} from "@/lib/store/favorites-slice";
import { useAppDispatch, useAppSelector, useAppStore } from "@/lib/store/hooks";

type FavoritesApi = {
  signedIn: boolean;
  isFavorite: (propertyId: string) => boolean;
  toggle: (propertyId: string) => void;
};

const FavoritesContext = createContext<FavoritesApi | null>(null);

export function useFavorites(): FavoritesApi {
  const api = useContext(FavoritesContext);
  if (!api) throw new Error("useFavorites must be used inside <FavoritesProvider>");
  return api;
}

export function FavoritesProvider({
  initialIds,
  signedIn,
  children,
}: {
  initialIds: string[];
  signedIn: boolean;
  children: ReactNode;
}) {
  const store = useAppStore();
  const serverKey = `${signedIn ? "1" : "0"}:${[...initialIds].sort().join(",")}`;
  const appliedKey = useRef<string | null>(null);
  // The client builds a second store, and refs start empty again after hydration.
  // Publish the server snapshot before favorite buttons read it, or aria-pressed
  // will not match the HTML. Later snapshots go through an effect: dispatching
  // during render notifies buttons that are already subscribed.
  if (appliedKey.current === null) {
    appliedKey.current = serverKey;
    store.dispatch(hydrated({ ids: initialIds, signedIn }));
  }
  useEffect(() => {
    if (appliedKey.current === serverKey) return;
    appliedKey.current = serverKey;
    store.dispatch(hydrated({ ids: initialIds, signedIn }));
  }, [serverKey, initialIds, signedIn, store]);

  const favorites = useAppSelector((state) => state.favorites);
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const toggle = useCallback(
    (propertyId: string) => {
      if (!favorites.signedIn) {
        dispatch(guestPromptShown(`${window.location.pathname}${window.location.search}`));
        return;
      }
      void dispatch(toggleFavorite(propertyId)).then((action) => {
        if (!toggleFavorite.rejected.match(action)) return;
        const intent = action.payload?.intent ?? true;
        toast({
          title: intent ? "We couldn't save that residence" : "We couldn't remove that residence",
          description: action.payload?.description ?? "Please try again in a moment.",
          tone: "danger",
        });
      });
    },
    [dispatch, favorites.signedIn, toast],
  );

  const dismissGuestPrompt = useCallback(() => {
    dispatch(guestPromptDismissed());
  }, [dispatch]);

  const api = useMemo<FavoritesApi>(
    () => ({
      signedIn: favorites.signedIn,
      isFavorite: (propertyId: string) => favoriteFlag(favorites, propertyId),
      toggle,
    }),
    [favorites, toggle],
  );

  return (
    <FavoritesContext.Provider value={api}>
      {children}
      <GuestPrompt next={favorites.guestPrompt} onDismiss={dismissGuestPrompt} />
    </FavoritesContext.Provider>
  );
}

const GUEST_PROMPT_MS = 7000;

function GuestPrompt({ next, onDismiss }: { next: string | null; onDismiss: () => void }) {
  useEffect(() => {
    if (next === null) return;
    const timer = window.setTimeout(onDismiss, GUEST_PROMPT_MS);
    return () => window.clearTimeout(timer);
  }, [next, onDismiss]);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-(--z-toast) flex justify-center p-4 sm:justify-end sm:p-6"
    >
      <AnimatePresence>
        {next !== null && (
          <motion.div
            key="guest"
            role="status"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: spring.panel }}
            exit={{ opacity: 0, scale: 0.96, transition: tween.exit }}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-4 rounded-[1.25rem] bg-night px-5 py-4 text-on-night shadow-float ring-1 ring-white/10"
          >
            <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-soft" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="text-small font-medium">Sign in to save residences</p>
              <p className="text-small text-on-night-muted">
                Your shortlist follows you to every device.{" "}
                <Link
                  href={`/login?next=${encodeURIComponent(next)}`}
                  className="text-accent-soft underline decoration-accent-soft/40 underline-offset-4 transition-colors duration-300 ease-settle hover:decoration-accent-soft"
                >
                  Sign in
                </Link>
              </p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss"
              className="-mr-1 grid size-7 shrink-0 place-items-center rounded-full text-on-night-muted transition-colors duration-300 ease-settle hover:bg-white/10 hover:text-on-night"
            >
              <X size={13} weight="light" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
