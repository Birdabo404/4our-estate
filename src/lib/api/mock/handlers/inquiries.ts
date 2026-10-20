import { newId } from "../dataset";
import { forbidden, notFound, ok, tooMany } from "../http";
import { compareIso, toInquiry } from "../present";
import { parseInquiry, parseInquiryStatus } from "../validate";
import type { Handler } from "./context";

const HOUR_MS = 60 * 60 * 1000;

export const createInquiry: Handler = ({ store, json, user }) => {
  const input = parseInquiry(json);
  const property = store.properties.find((row) => row.id === input.propertyId);
  if (!property || property.status !== "published") notFound("This listing is not open for inquiries.");
  const since = new Date(Date.now() - HOUR_MS).toISOString();
  const recent = store.inquiries.filter((inquiry) => inquiry.email === input.email && inquiry.createdAt > since).length;
  if (recent >= 5) tooMany("You have sent too many inquiries this hour. Try again later.");
  const id = newId();
  store.inquiries.push({
    id,
    propertyId: input.propertyId,
    buyerId: user?.id ?? null,
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
    message: input.message,
    preferredViewingDate: input.preferredViewingDate ?? null,
    status: "new",
    createdAt: new Date().toISOString(),
  });
  return ok({ id });
};

export const myInquiries: Handler = ({ store, user }) => {
  if (!user) notFound("That inquiry was not found.");
  const rows = store.inquiries
    .filter((inquiry) => inquiry.buyerId === user.id)
    .sort((left, right) => compareIso(left.createdAt, right.createdAt, "desc"));
  return ok(rows.map((inquiry) => toInquiry(store, inquiry)));
};

export const agentInquiries: Handler = ({ store, user }) => {
  if (!user) notFound("That inquiry was not found.");
  const rows = store.inquiries
    .filter((inquiry) => store.properties.some((property) => property.id === inquiry.propertyId && property.agentId === user.id))
    .sort((left, right) => compareIso(left.createdAt, right.createdAt, "desc"));
  return ok(rows.map((inquiry) => toInquiry(store, inquiry)));
};

export const setInquiryStatus: Handler = ({ store, params, json, user }) => {
  const status = parseInquiryStatus(json);
  const inquiry = store.inquiries.find((row) => row.id === params.id);
  if (!inquiry) notFound("That inquiry was not found.");
  const property = store.properties.find((row) => row.id === inquiry.propertyId);
  if (!user || !property || (user.role !== "admin" && property.agentId !== user.id)) {
    forbidden("That inquiry is not on one of your listings.");
  }
  inquiry.status = status;
  return ok({ id: inquiry.id, status: inquiry.status });
};
