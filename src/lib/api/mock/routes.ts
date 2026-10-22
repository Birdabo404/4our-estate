import type { Role } from "@/lib/domain/types";

import { unauthorized } from "./http";
import { adminStats, directory, moderationQueue, setRole } from "./handlers/admin";
import { login, me, signup } from "./handlers/auth";
import {
  createProperty,
  featuredProperties,
  listProperties,
  ownedListings,
  propertyById,
  propertyBySlug,
  propertyCities,
  propertyStats,
  similarProperties,
  transitionProperty,
  updateProperty,
} from "./handlers/catalog";
import type { Handler } from "./handlers/context";
import { addFavorite, favoriteIds, listFavorites, removeFavorite } from "./handlers/favorites";
import { coverImage, deleteImage, uploadImage } from "./handlers/images";
import { agentInquiries, createInquiry, myInquiries, setInquiryStatus } from "./handlers/inquiries";
import { getProfile, updateProfile } from "./handlers/profile";

export type RouteAuth = "public" | "optional" | "required";

export type Route = {
  method: string;
  pattern: string;
  auth: RouteAuth;
  roles?: readonly Role[];
  uuid?: readonly string[];
  handler: Handler;
};

const agentListings: Handler = ({ store, user }) => {
  if (!user) unauthorized();
  return ownedListings(store, user);
};

export const routes: readonly Route[] = [
  { method: "POST", pattern: "/auth/signup", auth: "public", handler: signup },
  { method: "POST", pattern: "/auth/login", auth: "public", handler: login },
  { method: "GET", pattern: "/auth/me", auth: "required", handler: me },

  { method: "GET", pattern: "/properties", auth: "public", handler: listProperties },
  { method: "GET", pattern: "/properties/featured", auth: "public", handler: featuredProperties },
  { method: "GET", pattern: "/properties/cities", auth: "public", handler: propertyCities },
  { method: "GET", pattern: "/properties/stats", auth: "public", handler: propertyStats },
  { method: "GET", pattern: "/properties/id/:id", auth: "required", roles: ["agent", "admin"], uuid: ["id"], handler: propertyById },
  { method: "GET", pattern: "/properties/:slug/similar", auth: "optional", handler: similarProperties },
  { method: "GET", pattern: "/properties/:slug", auth: "optional", handler: propertyBySlug },
  { method: "POST", pattern: "/properties", auth: "required", roles: ["agent", "admin"], handler: createProperty },
  { method: "PATCH", pattern: "/properties/:id", auth: "required", roles: ["agent", "admin"], uuid: ["id"], handler: updateProperty },
  { method: "POST", pattern: "/properties/:id/transitions", auth: "required", roles: ["agent", "admin"], uuid: ["id"], handler: transitionProperty },
  { method: "POST", pattern: "/properties/:id/images", auth: "required", roles: ["agent", "admin"], uuid: ["id"], handler: uploadImage },
  { method: "DELETE", pattern: "/properties/:id/images/:imageId", auth: "required", roles: ["agent", "admin"], uuid: ["id", "imageId"], handler: deleteImage },
  { method: "POST", pattern: "/properties/:id/images/:imageId/cover", auth: "required", roles: ["agent", "admin"], uuid: ["id", "imageId"], handler: coverImage },

  { method: "GET", pattern: "/me/favorites", auth: "required", roles: ["buyer", "agent", "admin"], handler: listFavorites },
  { method: "GET", pattern: "/me/favorites/ids", auth: "required", roles: ["buyer", "agent", "admin"], handler: favoriteIds },
  { method: "PUT", pattern: "/me/favorites/:propertyId", auth: "required", roles: ["buyer", "agent", "admin"], uuid: ["propertyId"], handler: addFavorite },
  { method: "DELETE", pattern: "/me/favorites/:propertyId", auth: "required", roles: ["buyer", "agent", "admin"], uuid: ["propertyId"], handler: removeFavorite },

  { method: "POST", pattern: "/inquiries", auth: "optional", handler: createInquiry },
  { method: "GET", pattern: "/me/inquiries", auth: "required", roles: ["buyer"], handler: myInquiries },
  { method: "GET", pattern: "/agent/inquiries", auth: "required", roles: ["agent", "admin"], handler: agentInquiries },
  { method: "PATCH", pattern: "/inquiries/:id/status", auth: "required", roles: ["agent", "admin"], uuid: ["id"], handler: setInquiryStatus },
  { method: "GET", pattern: "/agent/listings", auth: "required", roles: ["agent", "admin"], handler: agentListings },

  { method: "GET", pattern: "/me/profile", auth: "required", roles: ["buyer", "agent", "admin"], handler: getProfile },
  { method: "PATCH", pattern: "/me/profile", auth: "required", roles: ["buyer", "agent", "admin"], handler: updateProfile },

  { method: "GET", pattern: "/admin/stats", auth: "required", roles: ["admin"], handler: adminStats },
  { method: "GET", pattern: "/admin/moderation", auth: "required", roles: ["admin"], handler: moderationQueue },
  { method: "GET", pattern: "/admin/users", auth: "required", roles: ["admin"], handler: directory },
  { method: "PATCH", pattern: "/admin/users/:id/role", auth: "required", roles: ["admin"], uuid: ["id"], handler: setRole },
];

export function matchRoute(method: string, pathname: string): { route: Route; params: Record<string, string> } | null {
  const parts = pathname.split("/").filter(Boolean);
  for (const route of routes) {
    if (route.method !== method) continue;
    const pattern = route.pattern.split("/").filter(Boolean);
    if (pattern.length !== parts.length) continue;
    const params: Record<string, string> = {};
    let matched = true;
    for (let index = 0; index < pattern.length; index += 1) {
      const token = pattern[index] ?? "";
      const got = parts[index] ?? "";
      if (token.startsWith(":")) params[token.slice(1)] = got;
      else if (token !== got) {
        matched = false;
        break;
      }
    }
    if (matched) return { route, params };
  }
  return null;
}
