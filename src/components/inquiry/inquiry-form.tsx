"use client";

import { Check, Phone, WarningCircle } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion } from "framer-motion";
import {
  type FocusEvent,
  type FormEvent,
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { submitPropertyInquiry } from "@/lib/actions/inquire";
import { manilaToday, viewingDateError } from "@/lib/actions/viewing-date";
import { spring, tween } from "@/lib/motion";
import { inquirySchema, readInquiry } from "@/lib/validation/inquiry";

const FIELDS = ["name", "email", "phone", "preferredViewingDate", "message"] as const;
type FieldName = (typeof FIELDS)[number];
type FieldErrors = Partial<Record<FieldName, string>>;

function isField(key: unknown): key is FieldName {
  return typeof key === "string" && (FIELDS as readonly string[]).includes(key);
}

function validate(form: HTMLFormElement): FieldErrors {
  const formData = new FormData(form);
  const errors: FieldErrors = {};
  const result = inquirySchema.safeParse(readInquiry(formData));
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (isField(key) && !errors[key]) errors[key] = issue.message;
    }
  }
  const dateError = viewingDateError(formData.get("preferredViewingDate"));
  if (dateError && !errors.preferredViewingDate) errors.preferredViewingDate = dateError;
  return errors;
}

function fromServer(fieldErrors: Partial<Record<string, string>> | undefined): FieldErrors {
  const errors: FieldErrors = {};
  for (const [key, message] of Object.entries(fieldErrors ?? {})) if (isField(key) && message) errors[key] = message;
  return errors;
}

export type InquiryAgent = { firstName: string; phone: string | null };

type InquiryFormProps = {
  propertyId: string;
  propertyTitle: string;
  agent: InquiryAgent;
  defaults: { name: string; email: string };
  layout?: "panel" | "sheet";
};

export function InquiryForm(props: InquiryFormProps) {
  const [round, setRound] = useState(0);
  return <InquiryRound key={round} {...props} onAnother={() => setRound((n) => n + 1)} />;
}

function InquiryRound({
  propertyId,
  propertyTitle,
  agent,
  defaults,
  layout = "panel",
  onAnother,
}: InquiryFormProps & { onAnother: () => void }) {
  const { toast } = useToast();
  const form = useRef<HTMLFormElement>(null);
  const [result, dispatch, pending] = useActionState(submitPropertyInquiry, null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<ReadonlySet<FieldName>>(new Set());
  const [focusTarget, setFocusTarget] = useState<{ field: FieldName; at: number } | null>(null);
  const [seenResult, setSeenResult] = useState(result);
  const [sentTo, setSentTo] = useState(defaults.email);

  const showErrors = (next: FieldErrors) => {
    setErrors(next);
    const field = FIELDS.find((name) => next[name]);
    if (field) setFocusTarget((prev) => ({ field, at: (prev?.at ?? 0) + 1 }));
  };

  if (result !== seenResult) {
    setSeenResult(result);
    if (result && !result.ok) showErrors(fromServer(result.fieldErrors));
  }

  useEffect(() => {
    const control = focusTarget ? form.current?.elements.namedItem(focusTarget.field) : null;
    if (control instanceof HTMLElement) control.focus();
  }, [focusTarget]);

  useEffect(() => {
    if (result?.ok) toast({ title: "Inquiry sent", description: `${agent.firstName} will reply within one business day.`, tone: "positive" });
  }, [result, agent.firstName, toast]);

  const revalidate = (name: FieldName) => {
    if (!form.current) return;
    const next = validate(form.current)[name];
    setErrors((prev) => (prev[name] === next ? prev : { ...prev, [name]: next }));
  };

  const onBlur = (event: FocusEvent<HTMLFormElement>) => {
    const name = event.target.getAttribute("name");
    if (isField(name) && touched.has(name)) revalidate(name);
  };

  const onChange = (event: FormEvent<HTMLFormElement>) => {
    const name = (event.target as HTMLElement).getAttribute("name");
    if (!isField(name)) return;
    if (!touched.has(name)) setTouched((prev) => new Set(prev).add(name));
    if (errors[name]) revalidate(name);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const element = event.currentTarget;
    const nextErrors = validate(element);
    setTouched(new Set(FIELDS));
    showErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const formData = new FormData(element);
    setSentTo(String(formData.get("email") ?? ""));
    startTransition(() => dispatch(formData));
  };

  const formError = result && !result.ok ? result.formError : undefined;
  const pair = layout === "panel" ? "grid gap-5 xl:grid-cols-2" : "grid gap-5 sm:grid-cols-2";

  return (
    <AnimatePresence mode="wait" initial={false}>
      {result?.ok ? (
        <motion.div
          key="sent"
          role="status"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, transition: spring.panel }}
          exit={{ opacity: 0, transition: tween.exit }}
          className="flex flex-col items-start gap-5 py-4"
        >
          <motion.span
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: { ...spring.ui, delay: 0.12 } }}
            className="grid size-12 place-items-center rounded-full text-positive ring-1 ring-inset ring-positive/30"
          >
            <Check aria-hidden size={20} weight="regular" />
          </motion.span>
          <div className="flex flex-col gap-2">
            <h3 className="font-display text-heading">Your note is with {agent.firstName}</h3>
            <p className="text-body text-ink-soft">
              Expect a reply within one business day{sentTo ? <> at <span className="text-ink">{sentTo}</span></> : null}. Nothing is shared
              beyond the agent who represents {propertyTitle}.
            </p>
          </div>
          <button
            type="button"
            onClick={onAnother}
            className="text-small text-accent-ink underline decoration-accent-ink/30 underline-offset-4 transition-colors duration-300 ease-settle hover:decoration-accent-ink"
          >
            Write another note
          </button>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          ref={form}
          noValidate
          onSubmit={onSubmit}
          onBlur={onBlur}
          onChange={onChange}
          exit={{ opacity: 0, y: -8, transition: tween.exit }}
          aria-label={`Inquire about ${propertyTitle}`}
          className="flex flex-col gap-5"
        >
          <input type="hidden" name="propertyId" value={propertyId} />
          <div className={pair}>
            <Field label="Name" error={errors.name} required>
              <Input name="name" autoComplete="name" defaultValue={defaults.name} />
            </Field>
            <Field label="Email" error={errors.email} required>
              <Input name="email" type="email" autoComplete="email" inputMode="email" defaultValue={defaults.email} />
            </Field>
          </div>
          <div className={pair}>
            <Field label="Mobile" error={errors.phone}>
              <Input name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="0917 123 4567" />
            </Field>
            <Field label="Viewing date" error={errors.preferredViewingDate}>
              <Input name="preferredViewingDate" type="date" min={manilaToday()} />
            </Field>
          </div>
          <Field label="Message" error={errors.message} required>
            <Textarea
              name="message"
              rows={layout === "panel" ? 3 : 4}
              className="min-h-28"
              placeholder="When you would like to visit, and anything the agent should prepare."
            />
          </Field>

          <div aria-live="polite" className="empty:hidden">
            <AnimatePresence initial={false}>
              {formError && (
                <motion.div
                  key="form-error"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0, transition: tween.settle }}
                  exit={{ opacity: 0, transition: tween.exit }}
                  className="flex items-start gap-3 rounded-field bg-danger/[0.06] px-4 py-3.5 text-small text-danger ring-1 ring-inset ring-danger/20"
                >
                  <WarningCircle aria-hidden size={18} weight="regular" className="mt-0.5 shrink-0" />
                  <p>
                    {formError}
                    {agent.phone && (
                      <>
                        {" "}
                        You can also call {agent.firstName} on{" "}
                        <a href={`tel:${agent.phone.replace(/\s/g, "")}`} className="whitespace-nowrap underline underline-offset-4">
                          {agent.phone}
                        </a>
                        .
                      </>
                    )}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <Button type="submit" size="lg" icon="arrow-right" aria-disabled={pending} className="w-full sm:w-auto">
              {pending ? "Sending" : "Send inquiry"}
            </Button>
            {agent.phone && (
              <a
                href={`tel:${agent.phone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-2 text-small text-ink-soft transition-colors duration-300 ease-settle hover:text-ink"
              >
                <Phone aria-hidden size={15} weight="regular" />
                <span className="tabular">{agent.phone}</span>
              </a>
            )}
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
