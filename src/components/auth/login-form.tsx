"use client";

import { useState } from "react";

import { signIn } from "@/lib/actions/auth";
import { loginSchema, readLogin } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";

import { DemoAccounts } from "./demo-accounts";
import { FormAlert } from "@/components/dashboard/form-alert";
import { useZodForm } from "@/components/dashboard/use-zod-form";
import { fieldErrors } from "@/components/dashboard/zod-form";

const ORDER = ["email", "password"] as const;

function parseLogin(formData: FormData): Record<string, string> {
  const parsed = loginSchema.safeParse(readLogin(formData));
  return parsed.success ? {} : fieldErrors(parsed.error);
}

export function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { pending, errorFor, formError, onBlur, onSubmit } = useZodForm(signIn, parseLogin, ORDER);

  return (
    <Panel>
      <form noValidate onSubmit={onSubmit} onBlur={onBlur} className="flex flex-col gap-6">
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <Field label="Email" error={errorFor("email")} required>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Password" error={errorFor("password")} required>
          <Input
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <FormAlert message={formError} />
        <Button type="submit" disabled={pending} icon="arrow-right" className="w-full">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <DemoAccounts onUse={(account) => { setEmail(account.email); setPassword(account.password); }} />
    </Panel>
  );
}
