"use client";

import { createContext, type ReactNode, useContext, useMemo, useReducer } from "react";
import { Lightbox } from "./lightbox";
import type { GalleryImage } from "./photo-meta";

export type LightboxState =
  | { kind: "closed" }
  | { kind: "open"; index: number; source: string | null };

type LightboxAction =
  | { type: "opened"; index: number; source: string | null }
  | { type: "shown"; index: number }
  | { type: "closed" };

/** Only an unbroken open-then-close keeps the shared element; once you browse, the flight home would start offscreen. */
function lightboxReducer(state: LightboxState, action: LightboxAction): LightboxState {
  switch (action.type) {
    case "opened":
      return { kind: "open", index: action.index, source: action.source };
    case "shown":
      return state.kind === "open" ? { kind: "open", index: action.index, source: null } : state;
    case "closed":
      return { kind: "closed" };
    default: {
      const unhandled: never = action;
      return unhandled;
    }
  }
}

type GalleryApi = {
  images: readonly GalleryImage[];
  state: LightboxState;
  open: (index: number, source: string | null) => void;
};

const GalleryContext = createContext<GalleryApi | null>(null);

export function useGallery(): GalleryApi {
  const api = useContext(GalleryContext);
  if (!api) throw new Error("useGallery must be used inside <GalleryProvider>");
  return api;
}

export function isHiddenSource(state: LightboxState, layoutId: string): boolean {
  return state.kind === "open" && state.source === layoutId;
}

export function GalleryProvider({
  images,
  title,
  children,
}: {
  images: readonly GalleryImage[];
  title: string;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(lightboxReducer, { kind: "closed" });
  const api = useMemo<GalleryApi>(
    () => ({ images, state, open: (index, source) => dispatch({ type: "opened", index, source }) }),
    [images, state],
  );

  return (
    <GalleryContext.Provider value={api}>
      {children}
      <Lightbox
        images={images}
        title={title}
        state={state}
        onShow={(index) => dispatch({ type: "shown", index })}
        onClose={() => dispatch({ type: "closed" })}
      />
    </GalleryContext.Provider>
  );
}
