import { z } from "zod";

import { ROLES } from "@/lib/domain/types";

import { emptyToUndefined, optionalText } from "./fields";
import { optionalPhPhone } from "./phone";

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, { error: "Enter your name." }).max(80),
  phone: optionalPhPhone,
  avatarUrl: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .max(500)
      .refine((value) => value.startsWith("https://") || value.startsWith("http://"), {
        error: "Use an http or https image address.",
      })
      .optional(),
  ),
  agency: optionalText(120),
  licenseNo: optionalText(40),
  bio: optionalText(800),
});

export const userRoleSchema = z.object({
  userId: z.uuid({ error: "Choose a user." }),
  role: z.enum(ROLES),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type UserRoleInput = z.infer<typeof userRoleSchema>;

export function readProfile(formData: FormData) {
  return {
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    avatarUrl: formData.get("avatarUrl"),
    agency: formData.get("agency"),
    licenseNo: formData.get("licenseNo"),
    bio: formData.get("bio"),
  };
}

export function readUserRole(formData: FormData) {
  return {
    userId: formData.get("userId"),
    role: formData.get("role"),
  };
}
