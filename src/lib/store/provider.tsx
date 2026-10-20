"use client";

import { useRef, type ReactNode } from "react";
import { Provider } from "react-redux";
import { makeStore, type AppStore } from "./store";

export function StoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (storeRef.current == null) {
    storeRef.current = makeStore();
  }
  // The ref rule allows this null init and then rejects reading the instance back.
  // Provider has to receive that same store.
  // eslint-disable-next-line react-hooks/refs
  const store = storeRef.current;
  return <Provider store={store}>{children}</Provider>;
}
