/**
 * Drives the favorites reducer. No test runner.
 *
 *   npx tsx scripts/store/favorites.check.ts
 *
 * The slice imports the favorites server action, which imports `server-only`.
 * Next aliases that module. Plain tsx does not, so the stub is installed first.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import type { FavoritesState } from "../../src/lib/store/favorites-slice";
import type { RootState } from "../../src/lib/store/store";

type ResolveResult = { url: string; shortCircuit?: boolean };
type NextResolve = (specifier: string, context: object) => ResolveResult | Promise<ResolveResult>;

function installServerOnlyStub() {
  const require = createRequire(import.meta.url);
  const nodeModule = require("node:module") as {
    registerHooks: (hooks: { resolve: (specifier: string, context: object, nextResolve: NextResolve) => ResolveResult | Promise<ResolveResult> }) => void;
  };
  const stub = new URL("./server-only-stub.mjs", import.meta.url).href;
  nodeModule.registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === "server-only") return { url: stub, shortCircuit: true };
      return nextResolve(specifier, context);
    },
  });
}

function root(favorites: FavoritesState): RootState {
  return { favorites };
}

async function main() {
  installServerOnlyStub();
  const {
    favoritesReducer,
    guestPromptDismissed,
    guestPromptShown,
    hydrated,
    selectFavoriteCount,
    selectIsFavorite,
    toggleFavorite,
  } = await import("../../src/lib/store/favorites-slice");

  let state = favoritesReducer(undefined, { type: "@@init" });
  assert.deepEqual(state, { confirmed: [], pending: {}, latestRequest: {}, signedIn: false, guestPrompt: null });

  state = favoritesReducer(state, hydrated({ ids: ["house-a", "house-b"], signedIn: true }));
  assert.deepEqual(state.confirmed, ["house-a", "house-b"], "hydrate keeps server order");
  assert.equal(state.signedIn, true);
  assert.equal(state.guestPrompt, null);
  assert.equal(selectIsFavorite("house-a")(root(state)), true);
  assert.equal(selectIsFavorite("house-c")(root(state)), false);
  assert.equal(selectFavoriteCount(root(state)), 2);

  state = favoritesReducer(state, toggleFavorite.pending("req-a", "house-a"));
  assert.equal(state.pending["house-a"], false, "pending stores the optimistic intent");
  assert.equal(selectIsFavorite("house-a")(root(state)), false);
  assert.equal(selectIsFavorite("house-b")(root(state)), true);
  assert.equal(selectFavoriteCount(root(state)), 1);
  const duringHydrate = favoritesReducer(state, hydrated({ ids: ["house-a", "house-b"], signedIn: true }));
  assert.equal(selectIsFavorite("house-a")(root(duringHydrate)), false, "pending intent survives a server snapshot");
  assert.equal(duringHydrate.pending["house-a"], false);

  state = favoritesReducer(
    state,
    toggleFavorite.fulfilled({ propertyId: "house-a", favorited: true }, "req-a", "house-a"),
  );
  assert.deepEqual(state.confirmed, ["house-a", "house-b"], "fulfilled commits the server boolean");
  assert.equal(Object.hasOwn(state.pending, "house-a"), false);
  assert.equal(selectIsFavorite("house-a")(root(state)), true);
  assert.equal(selectFavoriteCount(root(state)), 2);

  state = favoritesReducer(state, toggleFavorite.pending("req-reject", "house-c"));
  assert.equal(state.pending["house-c"], true);
  assert.equal(selectIsFavorite("house-c")(root(state)), true);
  assert.equal(selectFavoriteCount(root(state)), 3);
  state = favoritesReducer(
    state,
    toggleFavorite.rejected(null, "req-reject", "house-c", {
      propertyId: "house-c",
      intent: true,
      description: "Please try again in a moment.",
    }),
  );
  assert.equal(Object.hasOwn(state.pending, "house-c"), false, "rejected toggle rolls back");
  assert.equal(selectIsFavorite("house-c")(root(state)), false);
  assert.deepEqual(state.confirmed, ["house-a", "house-b"]);
  assert.equal(selectFavoriteCount(root(state)), 2);

  state = favoritesReducer(state, toggleFavorite.pending("req-b1", "house-b"));
  state = favoritesReducer(state, toggleFavorite.pending("req-b2", "house-b"));
  assert.equal(selectIsFavorite("house-b")(root(state)), true, "a second tap flips the intent back");
  state = favoritesReducer(
    state,
    toggleFavorite.fulfilled({ propertyId: "house-b", favorited: false }, "req-b1", "house-b"),
  );
  assert.equal(state.pending["house-b"], true, "an older request settling keeps the newer intent");
  assert.equal(selectIsFavorite("house-b")(root(state)), true);
  state = favoritesReducer(
    state,
    toggleFavorite.fulfilled({ propertyId: "house-b", favorited: true }, "req-b2", "house-b"),
  );
  assert.equal(Object.hasOwn(state.pending, "house-b"), false, "the newest request clears the intent");
  assert.deepEqual(state.confirmed, ["house-a", "house-b"]);

  state = favoritesReducer(state, guestPromptShown("/properties?q=Makati"));
  assert.equal(state.guestPrompt, "/properties?q=Makati");
  assert.equal(selectFavoriteCount(root(state)), 2, "the guest prompt does not change membership");
  state = favoritesReducer(state, guestPromptDismissed());
  assert.equal(state.guestPrompt, null);
  assert.equal(state.signedIn, true);

  console.log("favorites slice check passed");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
