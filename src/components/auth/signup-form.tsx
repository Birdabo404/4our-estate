"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { signUp } from "@/lib/actions/auth";
import type { SignupRole } from "@/lib/domain/types";
import { tween } from "@/lib/motion";
import { readSignup, signupSchema } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Field, Input, SegmentedControl } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";

import { DemoAccounts } from "./demo-accounts";
import { PasswordMeter } from "./password-meter";
import { PENDING_LICENSE_KEY } from "./pending-license";
import { FormAlert } from "@/components/dashboard/form-alert";
import { useZodForm } from "@/components/dashboard/use-zod-form";
import { fieldErrors } from "@/components/dashboard/zod-form";

const ORDER = ["fullName", "email", "password", "phone", "agency", "licenseNo"] as const;

function parseSignup(formData: FormData): Record<string, string> {
  const parsed = signupSchema.safeParse(readSignup(formData));
  const errors = parsed.success ? {} : fieldErrors(parsed.error);
  if (formData.get("role") === "agent") {
    const agency = String(formData.get("agency") ?? "").trim();
    const license = String(formData.get("licenseNo") ?? "").trim();
    if (agency.length < 2) errors.agency = "Enter your agency.";
    if (license.length < 4 || license.length > 40) errors.licenseNo = "Enter your PRC license number.";
  }
  return errors;
}

export function SignupForm({ next, initialRole }: { next?: string; initialRole: SignupRole }) {
  const [role, setRole] = useState<SignupRole>(initialRole);
  const [password, setPassword] = useState("");
  const { state, pending, errorFor, formError, onBlur, onSubmit } = useZodForm(
    signUp,
    parseSignup,
    ORDER,
    (formData) => {
      if (formData.get("role") !== "agent") {
        sessionStorage.removeItem(PENDING_LICENSE_KEY);
        return;
      }
      sessionStorage.setItem(PENDING_LICENSE_KEY, String(formData.get("licenseNo") ?? "").trim());
    },
  );

  useEffect(() => {
    if (state && !state.ok) sessionStorage.removeItem(PENDING_LICENSE_KEY);
  }, [state]);

  return (
    <Panel>
      <form noValidate onSubmit={onSubmit} onBlur={onBlur} className="flex flex-col gap-6">
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <div className="flex flex-col gap-3">
          <p className="text-small font-medium text-ink" id="signup-role-label">
            I am joining as
          </p>
          <SegmentedControl
            name="role"
            aria-label="I am joining as"
            value={role}
            onValueChange={setRole}
            options={[
              { value: "buyer", label: "Buyer" },
              { value: "agent", label: "Agent" },
            ]}
          />
        </div>
        <Field label="Full name" error={errorFor("fullName")} required>
          <Input name="fullName" autoComplete="name" />
        </Field>
        <Field label="Email" error={errorFor("email")} required>
          <Input name="email" type="email" autoComplete="email" inputMode="email" spellCheck={false} />
        </Field>
        <Field label="Password" error={errorFor("password")} required>
          <Input
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <PasswordMeter password={password} />
        <Field label="Phone" hint="Optional. +63 9XX XXX XXXX or 09XXXXXXXXX." error={errorFor("phone")}>
          <Input name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="09XXXXXXXXX" />
        </Field>
        {role === "buyer" ? <input type="hidden" name="agency" value="" /> : null}
        {role === "agent" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={tween.settle}
            className="flex flex-col gap-6"
          >
            <Field label="Agency" error={errorFor("agency")} required>
              <Input name="agency" autoComplete="organization" />
            </Field>
            <Field label="PRC license" hint="Your Professional Regulation Commission number." error={errorFor("licenseNo")} required>
              <Input name="licenseNo" autoComplete="off" spellCheck={false} />
            </Field>
          </motion.div>
        ) : null}
        <FormAlert message={formError} />
        <Button type="submit" disabled={pending} icon="arrow-right" className="w-full">
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <DemoAccounts />
    </Panel>
  );
}
