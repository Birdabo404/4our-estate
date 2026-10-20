"use client";

import { X } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  createContext,
  type ReactNode,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useOptimistic,
  useReducer,
  useState,
} from "react";
import { useToast } from "@/components/ui/toast";
import { toggleFavorite } from "@/lib/actions/favorites";
import { spring, tween } from "@/lib/motion";

type Confirmed = ReadonlySet<string>;

type ConfirmedAction =
  | { type: "synced"; ids: readonly string[] }
  | { type: "settled"; propertyId: string; favorited: boolean };

type Intent = { propertyId: string; favorited: boolean };

function withMembership(ids: Confirmed, { propertyId, favorited }: Intent): Confirmed {
  if (ids.has(propertyId) === favorited) return ids;
  const next = new Set(ids);
  if (favorited) next.add(propertyId);
  else next.delete(propertyId);
  return next;
}

function confirmedReducer(state: Confirmed, action: ConfirmedAction): Confirmed {
  switch (action.type) {
    case "synced":
      return new Set(action.ids);
    case "settled":
      return withMembership(state, action);
    default: {
      const unhandled: never = action;
      return unhandled;
    }
  }
}

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
  const { toast } = useToast();
  const [confirmed, dispatch] = useReducer(confirmedReducer, initialIds, (ids) => new Set(ids));
  const [optimistic, addIntent] = useOptimistic(confirmed, withMembership);
  const [guestPrompt, setGuestPrompt] = useState<string | null>(null);

  const serverKey = [...initialIds].sort().join(",");
  const [syncedKey, setSyncedKey] = useState(serverKey);
  if (syncedKey !== serverKey) {
    setSyncedKey(serverKey);
    dispatch({ type: "synced", ids: initialIds });
  }

  const toggle = useCallback(
    (propertyId: string) => {
      if (!signedIn) {
        setGuestPrompt(`${window.location.pathname}${window.location.search}`);
        return;
      }
      const intent = { propertyId, favorited: !optimistic.has(propertyId) };
      startTransition(async () => {
        addIntent(intent);
        const formData = new FormData();
        formData.set("propertyId", propertyId);
        const result = await toggleFavorite(null, formData);
        startTransition(() => {
          if (result.ok) {
            dispatch({ type: "settled", propertyId, favorited: result.data.favorited });
          } else {
            toast({
              title: intent.favorited ? "We couldn't save that residence" : "We couldn't remove that residence",
              description: result.formError ?? "Please try again in a moment.",
              tone: "danger",
            });
          }
        });
      });
    },
    [signedIn, optimistic, addIntent, toast],
  );

  const api = useMemo<FavoritesApi>(
    () => ({ signedIn, isFavorite: (id) => optimistic.has(id), toggle }),
    [signedIn, optimistic, toggle],
  );

  return (
    <FavoritesContext.Provider value={api}>
      {children}
      <GuestPrompt next={guestPrompt} onDismiss={() => setGuestPrompt(null)} />
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
