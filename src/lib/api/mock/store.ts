import { buildDataset } from "./dataset";
import type { Store } from "./types";

const STORE_KEY = "4our-estate-mock-store";

type Bucket = {
  store?: Store;
  loading?: Promise<Store>;
};

function bucket(): Bucket {
  const scope = globalThis as typeof globalThis & { [STORE_KEY]?: Bucket };
  scope[STORE_KEY] ??= {};
  return scope[STORE_KEY];
}

// One store per server process. A fresh module from hot reload would otherwise rebuild the seed on the next request and drop writes.
export async function getStore(): Promise<Store> {
  const slot = bucket();
  if (slot.store) return slot.store;
  if (!slot.loading) {
    slot.loading = buildDataset()
      .then((store) => {
        slot.store = store;
        return store;
      })
      .catch((error: unknown) => {
        slot.loading = undefined;
        throw error;
      });
  }
  return slot.loading;
}
