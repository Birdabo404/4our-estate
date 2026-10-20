import { memberOf, signToken } from "../auth";
import { conflict, ok, unauthorized } from "../http";
import { newId } from "../dataset";
import type { MockUser } from "../types";
import { parseLogin, parseSignup } from "../validate";
import type { Handler } from "./context";

function session(user: MockUser) {
  return ok({ accessToken: signToken(user), user: memberOf(user) });
}

export const signup: Handler = ({ store, json }) => {
  const input = parseSignup(json);
  if (store.users.some((user) => user.email === input.email)) {
    conflict("An account with this email already exists.");
  }
  const now = new Date().toISOString();
  const user: MockUser = {
    id: newId(),
    email: input.email,
    password: input.password,
    role: input.role,
    fullName: input.fullName,
    phone: input.phone ?? null,
    agency: input.agency ?? null,
    licenseNo: input.licenseNo ?? null,
    bio: null,
    avatarUrl: null,
    createdAt: now,
    updatedAt: now,
  };
  store.users.push(user);
  return session(user);
};

export const login: Handler = ({ store, json }) => {
  const input = parseLogin(json);
  const user = store.users.find((row) => row.email === input.email);
  if (!user || user.password !== input.password) unauthorized("Email or password is incorrect.");
  return session(user);
};

export const me: Handler = ({ user }) => {
  if (!user) unauthorized();
  return ok(memberOf(user));
};
