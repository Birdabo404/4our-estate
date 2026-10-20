import { notFound, ok } from "../http";
import { compareIso, toSummary } from "../present";
import type { Handler } from "./context";

function visible(userRole: string, userId: string, status: string, agentId: string): boolean {
  if (status === "published" || status === "sold") return true;
  return userRole === "admin" || userId === agentId;
}

export const listFavorites: Handler = ({ store, user }) => {
  if (!user) notFound("Listing not found.");
  const rows = store.favorites
    .filter((favorite) => favorite.userId === user.id)
    .sort((left, right) => compareIso(left.createdAt, right.createdAt, "desc"));
  const summaries = rows.flatMap((favorite) => {
    const property = store.properties.find((row) => row.id === favorite.propertyId);
    if (!property || !visible(user.role, user.id, property.status, property.agentId)) return [];
    return [toSummary(store, property)];
  });
  return ok(summaries);
};

export const favoriteIds: Handler = ({ store, user }) => {
  if (!user) notFound("Listing not found.");
  const ids = store.favorites
    .filter((favorite) => favorite.userId === user.id)
    .sort((left, right) => compareIso(left.createdAt, right.createdAt, "desc"))
    .map((favorite) => favorite.propertyId);
  return ok(ids);
};

export const addFavorite: Handler = ({ store, params, user }) => {
  if (!user) notFound("Listing not found.");
  const propertyId = params.propertyId ?? "";
  const property = store.properties.find((row) => row.id === propertyId);
  if (!property || (property.status !== "published" && property.status !== "sold")) notFound("Listing not found.");
  const existing = store.favorites.find((favorite) => favorite.userId === user.id && favorite.propertyId === propertyId);
  if (!existing) {
    store.favorites.push({ userId: user.id, propertyId, createdAt: new Date().toISOString() });
  }
  return ok({ favorited: true });
};

export const removeFavorite: Handler = ({ store, params, user }) => {
  if (!user) notFound("Listing not found.");
  const propertyId = params.propertyId ?? "";
  const index = store.favorites.findIndex((favorite) => favorite.userId === user.id && favorite.propertyId === propertyId);
  if (index >= 0) store.favorites.splice(index, 1);
  return ok({ favorited: false });
};
