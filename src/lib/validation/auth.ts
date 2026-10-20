import { z } from "zod";

import { SIGNUP_ROLES } from "@/lib/domain/types";

import { optionalPhPhone } from "./phone";

const email = z
  .string()
  .trim()
  .max(160)
  .pipe(z.email({ error: "Enter a valid email." }));

const PASSWORD = "Use 8 to 72 characters, including a letter and a number.";

function absent(value: unknown): unknown {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}

export const signupSchema = z
  .object({
    role: z.enum(SIGNUP_ROLES),
    fullName: z.string().trim().min(2, { error: "Enter your full name." }).max(80),
    email,
    password: z
      .string()
      .min(8, { error: PASSWORD })
      .max(72, { error: PASSWORD })
      .regex(/[A-Za-z]/, { error: PASSWORD })
      .regex(/\d/, { error: PASSWORD }),
    phone: optionalPhPhone,
    agency: z.preprocess(absent, z.string().trim().min(1).max(120).optional()),
    licenseNo: z.preprocess(absent, z.string().trim().min(1).max(40).optional()),
  })
  .superRefine((value, ctx) => {
    if (value.role !== "agent") return;
    if (!value.agency) {
      ctx.addIssue({ code: "custom", path: ["agency"], message: "Enter your agency." });
    }
    if (!value.licenseNo) {
      ctx.addIssue({ code: "custom", path: ["licenseNo"], message: "Enter your license number." });
    }
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
    licenseNo: formData.get("licenseNo"),
  };
}

export function readLogin(formData: FormData) {
  return {
    email: formData.get("email"),
    password: formData.get("password"),
  };
}
