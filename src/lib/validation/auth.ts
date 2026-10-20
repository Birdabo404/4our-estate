import { z } from "zod";

import { SIGNUP_ROLES } from "@/lib/domain/types";

import { optionalText } from "./fields";
import { optionalPhPhone } from "./phone";

const email = z
  .string()
  .trim()
  .max(160)
  .pipe(z.email({ error: "Enter a valid email." }));

export const signupSchema = z.object({
  role: z.enum(SIGNUP_ROLES),
  fullName: z.string().trim().min(2, { error: "Enter your full name." }).max(80),
  email,
  password: z
    .string()
    .min(8, { error: "Use at least 8 characters." })
    .max(72),
  phone: optionalPhPhone,
  agency: optionalText(120),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: "Enter your password." }),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export function readSignup(formData: FormData) {
  return {
    role: formData.get("role"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone"),
    agency: formData.get("agency"),
  };
}

export function readLogin(formData: FormData) {
  return {
    email: formData.get("email"),
    password: formData.get("password"),
  };
}
