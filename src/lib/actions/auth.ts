"use server";

import { redirect } from "next/navigation";

import { dashboardPath, safeNext } from "@/lib/auth/paths";
import type { Role } from "@/lib/domain/types";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, readLogin, readSignup, signupSchema } from "@/lib/validation/auth";

import { humanize } from "./errors";
import { fail, invalid, type ActionResult } from "./result";

function isRole(value: string): value is Role {
  return value === "buyer" || value === "agent" || value === "admin";
}

export async function signUp(
  _prev: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const parsed = signupSchema.safeParse(readSignup(formData));
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        role: parsed.data.role,
        full_name: parsed.data.fullName,
        phone: parsed.data.phone ?? "",
        agency: parsed.data.agency ?? "",
      },
    },
  });

  if (error) return fail(humanize(error));
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return fail("An account with this email already exists.");
  }
  if (!data.session) {
    return fail("Confirm your email before signing in.");
  }

  redirect(safeNext(formData.get("next"), dashboardPath(parsed.data.role)));
}

export async function signIn(
  _prev: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const parsed = loginSchema.safeParse(readLogin(formData));
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error || !data.user) {
    return fail(error ? humanize(error) : "Email or password is incorrect.");
  }

  const profile = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  const role = profile.data && isRole(profile.data.role) ? profile.data.role : "buyer";
  redirect(safeNext(formData.get("next"), dashboardPath(role)));
}

export async function signOut(
  prev: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  void prev;
  void formData;
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) return fail(humanize(error));
  redirect("/");
}
