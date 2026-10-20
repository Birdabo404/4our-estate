"use server";

import { redirect } from "next/navigation";

import { apiFetch, clearSession, setSession } from "@/lib/api/client";
import { dashboardPath, safeNext } from "@/lib/auth/paths";
import type { Viewer } from "@/lib/domain/types";
import { loginSchema, readLogin, readSignup, signupSchema } from "@/lib/validation/auth";

import { failure } from "./failure";
import { invalid, type ActionResult } from "./result";

type Session = {
  accessToken: string;
  user: Extract<Viewer, { kind: "member" }>;
};

export async function signUp(
  _prev: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const parsed = signupSchema.safeParse(readSignup(formData));
  if (!parsed.success) return invalid(parsed.error);

  const input = parsed.data;
  const json: Record<string, string> = {
    role: input.role,
    fullName: input.fullName,
    email: input.email,
    password: input.password,
  };
  if (input.phone) json.phone = input.phone;
  if (input.agency) json.agency = input.agency;
  if (input.licenseNo) json.licenseNo = input.licenseNo;

  try {
    const { data } = await apiFetch<Session>("/auth/signup", { method: "POST", json, auth: false });
    await setSession(data.accessToken);
    redirect(safeNext(formData.get("next"), dashboardPath(data.user.role)));
  } catch (error) {
    return failure(error);
  }
}

export async function signIn(
  _prev: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const parsed = loginSchema.safeParse(readLogin(formData));
  if (!parsed.success) return invalid(parsed.error);

  try {
    const { data } = await apiFetch<Session>("/auth/login", {
      method: "POST",
      json: { email: parsed.data.email, password: parsed.data.password },
      auth: false,
    });
    await setSession(data.accessToken);
    redirect(safeNext(formData.get("next"), dashboardPath(data.user.role)));
  } catch (error) {
    return failure(error);
  }
}

export async function signOut(
  prev: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  void prev;
  void formData;
  await clearSession();
  redirect("/");
}
