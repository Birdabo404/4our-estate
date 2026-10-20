import "server-only";

import { apiFetch } from "@/lib/api/client";
import type { Inquiry, PropertySummary } from "@/lib/domain/types";

import { failLoad } from "./query";
import { requireRole } from "./viewer";

export async function listFavorites(): Promise<PropertySummary[]> {
  await requireRole("buyer", "agent", "admin");
  try {
    const { data } = await apiFetch<PropertySummary[]>("/me/favorites");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return failLoad("favorites", error);
  }
}

export async function getFavoriteIds(): Promise<string[]> {
  await requireRole("buyer", "agent", "admin");
  try {
    const { data } = await apiFetch<string[]>("/me/favorites/ids");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return failLoad("favorites", error);
  }
}

export async function listMyInquiries(): Promise<Inquiry[]> {
  await requireRole("buyer");
  try {
    const { data } = await apiFetch<Inquiry[]>("/me/inquiries");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return failLoad("inquiries", error);
  }
}
