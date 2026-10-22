import { badRequest, forbidden, notFound, ok, unauthorized } from "../http";
import { canManage } from "../present";
import type { MockUser, Store } from "../types";
import type { Handler } from "./context";

function requireManaged(store: Store, id: string, user: MockUser | null) {
  if (!user) unauthorized();
  const property = store.properties.find((row) => row.id === id);
  if (!property) notFound("Listing not found.");
  if (!canManage(user, property.agentId)) forbidden("You cannot edit this listing.");
  return property;
}

export const uploadImage: Handler = ({ store, params, user }) => {
  requireManaged(store, params.id ?? "", user);
  badRequest("Photo uploads need the live API. Mock mode keeps listings read-only for images.");
};

export const deleteImage: Handler = ({ store, params, user }) => {
  const propertyId = params.id ?? "";
  const imageId = params.imageId ?? "";
  requireManaged(store, propertyId, user);
  const index = store.images.findIndex((image) => image.id === imageId && image.propertyId === propertyId);
  if (index < 0) notFound("Photo not found.");
  store.images.splice(index, 1);
  return ok({ id: imageId });
};

export const coverImage: Handler = ({ store, params, user }) => {
  const propertyId = params.id ?? "";
  const imageId = params.imageId ?? "";
  requireManaged(store, propertyId, user);
  const images = store.images
    .filter((image) => image.propertyId === propertyId)
    .sort((left, right) => left.position - right.position);
  const target = images.find((image) => image.id === imageId);
  if (!target) notFound("Photo not found.");
  const ordered = [target, ...images.filter((image) => image.id !== imageId)];
  ordered.forEach((image, index) => {
    image.position = index;
  });
  return ok({ id: target.id, url: target.url, alt: target.alt, position: target.position });
};
