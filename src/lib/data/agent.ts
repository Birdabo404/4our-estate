import "server-only";

import { apiFetch } from "@/lib/api/client";
import type { Inquiry, PropertyDetail, PropertySummary } from "@/lib/domain/types";

import { failLoad, nullIfMissing } from "./query";
import { requireRole } from "./viewer";

export async function listAgentListings(): Promise<PropertySummary[]> {
  await requireRole("agent", "admin");
  try {
    const { data } = await apiFetch<PropertySummary[]>("/agent/listings");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return failLoad("listings", error);
  }
}

export async function listAgentInquiries(): Promise<Inquiry[]> {
  await requireRole("agent", "admin");
  try {
    const { data } = await apiFetch<Inquiry[]>("/agent/inquiries");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return failLoad("inquiries", error);
  }
}

export async function getEditableProperty(id: string): Promise<PropertyDetail | null> {
  await requireRole("agent", "admin");
  try {
    const { data } = await apiFetch<PropertyDetail>(`/properties/id/${encodeURIComponent(id)}`);
    return data;
  } catch (error) {
    return nullIfMissing("listing", error);
  }
}
