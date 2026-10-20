import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { unstable_rethrow } from "next/navigation";
import { toggleFavorite as toggleFavoriteAction } from "@/lib/actions/favorites";
import type { RootState } from "./store";

export type FavoritesState = {
  confirmed: string[];
  pending: Record<string, boolean>;
  latestRequest: Record<string, string>;
  signedIn: boolean;
  guestPrompt: string | null;
};

const initialState: FavoritesState = {
  confirmed: [],
  pending: {},
  latestRequest: {},
  signedIn: false,
  guestPrompt: null,
};

export type ToggleRejection = {
  propertyId: string;
  intent: boolean;
  description: string;
};

/** Pending intent wins. A missing key falls through to the last server snapshot. */
export function isFavorite(state: FavoritesState, propertyId: string): boolean {
  if (Object.hasOwn(state.pending, propertyId)) return state.pending[propertyId] ?? false;
  return state.confirmed.includes(propertyId);
}

export const toggleFavorite = createAsyncThunk<
  { propertyId: string; favorited: boolean },
  string,
  { state: RootState; rejectValue: ToggleRejection }
>("favorites/toggle", async (propertyId, { getState, rejectWithValue }) => {
  const intent = isFavorite(getState().favorites, propertyId);
  const formData = new FormData();
  formData.set("propertyId", propertyId);
  try {
    const result = await toggleFavoriteAction(null, formData);
    if (result.ok) return { propertyId, favorited: result.data.favorited };
    return rejectWithValue({
      propertyId,
      intent,
      description: result.formError ?? "Please try again in a moment.",
    });
  } catch (error) {
    unstable_rethrow(error);
    const description = error instanceof Error && error.message ? error.message : "Please try again in a moment.";
    return rejectWithValue({ propertyId, intent, description });
  }
});

function commit(confirmed: string[], propertyId: string, favorited: boolean): string[] {
  const saved = confirmed.includes(propertyId);
  if (favorited && !saved) return [...confirmed, propertyId];
  if (!favorited && saved) return confirmed.filter((id) => id !== propertyId);
  return confirmed;
}

/** An older request settling must not erase the intent of a newer tap on the same property. */
function settle(state: FavoritesState, propertyId: string, requestId: string): void {
  if (state.latestRequest[propertyId] !== requestId) return;
  delete state.pending[propertyId];
  delete state.latestRequest[propertyId];
}

const favoritesSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {
    hydrated(state, action: PayloadAction<{ ids: string[]; signedIn: boolean }>) {
      state.confirmed = [...action.payload.ids];
      state.signedIn = action.payload.signedIn;
    },
    guestPromptShown(state, action: PayloadAction<string>) {
      state.guestPrompt = action.payload;
    },
    guestPromptDismissed(state) {
      state.guestPrompt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(toggleFavorite.pending, (state, action) => {
        const propertyId = action.meta.arg;
        state.pending[propertyId] = !isFavorite(state, propertyId);
        state.latestRequest[propertyId] = action.meta.requestId;
      })
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        const { propertyId, favorited } = action.payload;
        state.confirmed = commit(state.confirmed, propertyId, favorited);
        settle(state, propertyId, action.meta.requestId);
      })
      .addCase(toggleFavorite.rejected, (state, action) => {
        settle(state, action.meta.arg, action.meta.requestId);
      });
  },
});

export const { hydrated, guestPromptShown, guestPromptDismissed } = favoritesSlice.actions;
export const favoritesReducer = favoritesSlice.reducer;

export function selectIsFavorite(propertyId: string) {
  return (state: RootState) => isFavorite(state.favorites, propertyId);
}

export function selectFavoriteCount(state: RootState): number {
  const saved = new Set(state.favorites.confirmed);
  for (const [propertyId, on] of Object.entries(state.favorites.pending)) {
    if (on) saved.add(propertyId);
    else saved.delete(propertyId);
  }
  return saved.size;
}
