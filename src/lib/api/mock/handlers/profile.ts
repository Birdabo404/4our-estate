import { ok, unauthorized } from "../http";
import { toProfile } from "../present";
import { parseProfile } from "../validate";
import type { Handler } from "./context";

export const getProfile: Handler = ({ user }) => {
  if (!user) unauthorized();
  return ok(toProfile(user));
};

export const updateProfile: Handler = ({ user, json }) => {
  if (!user) unauthorized();
  const patch = parseProfile(json);
  user.fullName = patch.fullName;
  if (patch.phone !== undefined) user.phone = patch.phone;
  if (patch.avatarUrl !== undefined) user.avatarUrl = patch.avatarUrl;
  if (patch.agency !== undefined) user.agency = patch.agency;
  if (patch.licenseNo !== undefined) user.licenseNo = patch.licenseNo;
  if (patch.bio !== undefined) user.bio = patch.bio;
  user.updatedAt = new Date().toISOString();
  return ok(toProfile(user));
};
