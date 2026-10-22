import { z } from "zod";

import { INQUIRY_STATUSES } from "@/lib/domain/types";

import { emptyToUndefined } from "./fields";
import { optionalPhPhone } from "./phone";

const viewingDate = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Use a date like 2026-11-08." })
    .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), {
      error: "That date is not valid.",
    })
    .optional(),
);

export const inquirySchema = z.object({
  propertyId: z.uuid({ error: "Choose a listing." }),
  name: z.string().trim().min(2, { error: "Enter your name." }).max(80),
  email: z
    .string()
    .trim()
    .max(160)
    .pipe(z.email({ error: "Enter a valid email." })),
  phone: optionalPhPhone,
  message: z
    .string()
    .trim()
    .min(20, { error: "Write at least 20 characters." })
    .max(2000),
  preferredViewingDate: viewingDate,
});

export const inquiryStatusSchema = z.object({
  id: z.uuid({ error: "Choose an inquiry." }),
  status: z.enum(INQUIRY_STATUSES),
});

export type InquiryInput = z.infer<typeof inquirySchema>;
export type InquiryStatusInput = z.infer<typeof inquiryStatusSchema>;

export function readInquiry(formData: FormData) {
  return {
    propertyId: formData.get("propertyId"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    message: formData.get("message"),
    preferredViewingDate: formData.get("preferredViewingDate"),
  };
}

export function readInquiryStatus(formData: FormData) {
  return {
    id: formData.get("id"),
    status: formData.get("status"),
  };
}
