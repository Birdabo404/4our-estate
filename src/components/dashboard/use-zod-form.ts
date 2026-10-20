"use client";

import { type FocusEvent, type FormEvent, startTransition, useActionState, useEffect, useState } from "react";

import type { ActionResult } from "@/lib/actions/result";

import { firstInvalid, focusNamed } from "./zod-form";

export function useZodForm<T>(
  action: (prev: ActionResult<T> | null, formData: FormData) => Promise<ActionResult<T>>,
  parse: (formData: FormData) => Record<string, string>,
  order: readonly string[],
  beforeAction?: (formData: FormData) => void,
) {
  const [state, formAction, pending] = useActionState(action, null);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!state || state.ok) return;
    const key = firstInvalid(state.fieldErrors ?? {}, order);
    if (key) focusNamed(key);
  }, [state, order]);

  function errorFor(name: string): string | undefined {
    if ((submitted || touched[name]) && clientErrors[name]) return clientErrors[name];
    if (state && !state.ok) return state.fieldErrors?.[name];
    return undefined;
  }

  function onBlur(event: FocusEvent<HTMLFormElement>) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const name = target.getAttribute("name");
    if (!name) return;
    setTouched((current) => ({ ...current, [name]: true }));
    setClientErrors(parse(new FormData(event.currentTarget)));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const errors = parse(formData);
    setClientErrors(errors);
    setSubmitted(true);
    const key = firstInvalid(errors, order) ?? Object.keys(errors)[0];
    if (key) {
      focusNamed(key);
      return;
    }
    beforeAction?.(formData);
    startTransition(() => {
      formAction(formData);
    });
  }

  const formError = state && !state.ok ? state.formError : undefined;
  return { state, pending, errorFor, formError, onBlur, onSubmit };
}
