"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { updateProfile } from "@/lib/actions/profile";
import type { Role } from "@/lib/domain/types";
import { readProfile, profileSchema } from "@/lib/validation/profile";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import type { OwnProfile } from "@/lib/data/profile";

import { FormAlert } from "./form-alert";
import { useZodForm } from "./use-zod-form";
import { fieldErrors } from "./zod-form";

const ORDER = ["fullName", "phone", "agency", "licenseNo", "bio", "avatarUrl"] as const;

function parseProfile(formData: FormData): Record<string, string> {
  const parsed = profileSchema.safeParse(readProfile(formData));
  return parsed.success ? {} : fieldErrors(parsed.error);
}

export function ProfileForm({ profile }: { profile: OwnProfile }) {
  const router = useRouter();
  const { toast } = useToast();
  const { state, pending, errorFor, formError, onBlur, onSubmit } = useZodForm(updateProfile, parseProfile, ORDER);

  useEffect(() => {
    if (!state?.ok) return;
    toast({ title: "Profile saved", tone: "positive" });
    router.refresh();
  }, [state, toast, router]);

  return (
    <Panel className="max-w-2xl">
      <form noValidate onSubmit={onSubmit} onBlur={onBlur} className="flex flex-col gap-6">
      <input type="hidden" name="avatarUrl" value={profile.avatarUrl ?? ""} />
        <Field label="Full name" error={errorFor("fullName")} required>
          <Input name="fullName" autoComplete="name" defaultValue={profile.fullName} />
        </Field>
        <Field label="Phone" hint="+63 9XX XXX XXXX or 09XXXXXXXXX." error={errorFor("phone")}>
          <Input name="phone" type="tel" autoComplete="tel" defaultValue={profile.phone ?? ""} />
        </Field>
        <RoleFields role={profile.role} agency={profile.agency} licenseNo={profile.licenseNo} errorFor={errorFor} />
        <Field label="A short note" hint="Optional. Shown to people you work with." error={errorFor("bio")}>
          <Textarea name="bio" defaultValue={profile.bio ?? ""} />
        </Field>
        <FormAlert message={formError} />
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function RoleFields({
  role,
  agency,
  licenseNo,
  errorFor,
}: {
  role: Role;
  agency: string | null;
  licenseNo: string | null;
  errorFor: (name: string) => string | undefined;
}) {
  if (role === "buyer") {
    return (
      <>
        <input type="hidden" name="agency" value="" />
        <input type="hidden" name="licenseNo" value="" />
      </>
    );
  }

  return (
    <>
      <Field label="Agency" error={errorFor("agency")}>
        <Input name="agency" autoComplete="organization" defaultValue={agency ?? ""} />
      </Field>
      <Field label="PRC license" error={errorFor("licenseNo")}>
        <Input name="licenseNo" defaultValue={licenseNo ?? ""} spellCheck={false} />
      </Field>
    </>
  );
}
