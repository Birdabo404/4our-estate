import { compareIso, toSummary } from "../present";
import { conflict, notFound, ok } from "../http";
import { parseRole } from "../validate";
import type { Handler } from "./context";

export const adminStats: Handler = ({ store }) => {
  return ok({
    userCount: store.users.length,
    listingCount: store.properties.length,
    pendingCount: store.properties.filter((property) => property.status === "pending").length,
    publishedCount: store.properties.filter((property) => property.status === "published").length,
    inquiryCount: store.inquiries.length,
    newInquiryCount: store.inquiries.filter((inquiry) => inquiry.status === "new").length,
  });
};

export const moderationQueue: Handler = ({ store }) => {
  const rows = store.properties
    .filter((property) => property.status === "pending")
    .sort((left, right) => compareIso(left.createdAt, right.createdAt, "asc"));
  return ok(rows.map((property) => toSummary(store, property)));
};

export const directory: Handler = ({ store }) => {
  const rows = [...store.users].sort((left, right) => compareIso(left.createdAt, right.createdAt, "asc"));
  return ok(
    rows.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      phone: user.phone,
      agency: user.agency,
      createdAt: user.createdAt,
    })),
  );
};

export const setRole: Handler = ({ store, params, json }) => {
  const role = parseRole(json);
  const user = store.users.find((row) => row.id === params.id);
  if (!user) notFound("That user was not found.");
  if (user.role === "admin" && role !== "admin") {
    const others = store.users.filter((row) => row.role === "admin" && row.id !== user.id).length;
    if (others === 0) conflict("The last admin cannot be removed.");
  }
  user.role = role;
  user.updatedAt = new Date().toISOString();
  return ok({ id: user.id, role: user.role });
};
