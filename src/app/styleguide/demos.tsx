"use client";

import { ArrowCounterClockwise, HeartStraight } from "@phosphor-icons/react/ssr";
import { motion } from "framer-motion";
import { type FormEvent, useState } from "react";
import { z } from "zod";
import { Wordmark } from "@/components/motion/wordmark";
import { Button } from "@/components/ui/button";
import { Dialog, Sheet } from "@/components/ui/dialog";
import { Checkbox, Field, Input, SegmentedControl, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { PROPERTY_TYPES } from "@/lib/domain/types";
import { cn } from "@/lib/cn";
import { spring } from "@/lib/motion";

const inquirySchema = z.object({
  name: z.string().trim().min(2, "Tell us your name so the agent can address you."),
  email: z.email("Enter an email we can reach you at, like ana@domain.ph."),
  phone: z.string().trim().regex(/^(\+63|0)9\d{9}$/, "Use a mobile number like 0917 123 4567.").or(z.literal("")),
  propertyType: z.enum(PROPERTY_TYPES),
  message: z.string().trim().min(20, "A sentence or two helps the agent prepare. 20 characters at least."),
});

type InquiryValues = z.input<typeof inquirySchema>;
type FieldErrors = Partial<Record<keyof InquiryValues, string[]>>;

function validate(values: InquiryValues): FieldErrors {
  const result = inquirySchema.safeParse(values);
  return result.success ? {} : z.flattenError(result.error).fieldErrors;
}

const INITIAL: InquiryValues = {
  name: "Ana Reyes",
  email: "ana@",
  phone: "0917 123",
  propertyType: "penthouse",
  message: "",
};

export function InquiryFormDemo() {
  const { toast } = useToast();
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState<FieldErrors>(() => validate(INITIAL));

  const set = (key: keyof InquiryValues) => (value: string) => {
    const next = { ...values, [key]: key === "phone" ? value.replace(/\s/g, "") : value };
    setValues(next);
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: validate(next)[key] }));
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      toast({ title: "Inquiry sent", description: "Your agent will reply within one business day.", tone: "positive" });
    }
  };

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-7 md:grid-cols-2">
      <Field label="Full name" error={errors.name} required>
        <Input name="name" autoComplete="name" value={values.name} onChange={(e) => set("name")(e.target.value)} />
      </Field>
      <Field label="Email" error={errors.email} required>
        <Input name="email" type="email" autoComplete="email" value={values.email} onChange={(e) => set("email")(e.target.value)} />
      </Field>
      <Field label="Mobile" hint="Optional. We only call to confirm a viewing." error={errors.phone}>
        <Input name="phone" type="tel" autoComplete="tel" value={values.phone} onChange={(e) => set("phone")(e.target.value)} />
      </Field>
      <Field label="Looking for" error={errors.propertyType}>
        <Select name="propertyType" value={values.propertyType} onChange={(e) => set("propertyType")(e.target.value)}>
          {PROPERTY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type[0]?.toUpperCase() + type.slice(1)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Message" error={errors.message} required className="md:col-span-2">
        <Textarea
          name="message"
          placeholder="I would like to view the residence on a weekday morning."
          value={values.message}
          onChange={(e) => set("message")(e.target.value)}
        />
      </Field>
      <div className="flex flex-col gap-6 md:col-span-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-5">
          <SegmentedControl
            name="intent"
            aria-label="Intent"
            defaultValue="buy"
            options={[
              { value: "buy", label: "Buy" },
              { value: "lease", label: "Lease" },
              { value: "sell", label: "Sell" },
            ]}
          />
          <Checkbox name="consent" defaultChecked label="Share my details with the listing agent only" />
        </div>
        <Button type="submit" icon="arrow-up-right">
          Send inquiry
        </Button>
      </div>
    </form>
  );
}

export function OverlayDemo() {
  const { toast } = useToast();
  const [dialog, setDialog] = useState(false);
  const [sheet, setSheet] = useState(false);
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="secondary" onClick={() => setDialog(true)}>
        Open dialog
      </Button>
      <Button variant="secondary" onClick={() => setSheet(true)}>
        Open sheet
      </Button>
      <Button
        variant="ghost"
        onClick={() => toast({ title: "Saved to favorites", description: "The Acacia House, Forbes Park" })}
      >
        Show toast
      </Button>

      <Dialog
        open={dialog}
        onClose={() => setDialog(false)}
        title="Schedule a private viewing"
        description="Your agent confirms within one business day."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialog(false)}>
              Not now
            </Button>
            <Button
              icon="arrow-right"
              onClick={() => {
                setDialog(false);
                toast({ title: "Viewing requested", tone: "positive" });
              }}
            >
              Request viewing
            </Button>
          </>
        }
      >
        <p className="text-body text-ink-soft">
          Viewings at Forbes Park are by appointment on weekdays between 9 am and 5 pm. Bring a valid ID for the village
          gate.
        </p>
      </Dialog>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Filters" description="Refine the collection.">
        <div className="flex flex-col gap-7">
          <Field label="City">
            <Select defaultValue="makati">
              <option value="makati">Makati</option>
              <option value="taguig">Taguig</option>
              <option value="cebu">Cebu</option>
            </Select>
          </Field>
          <SegmentedControl
            name="sheet-type"
            aria-label="Listing type"
            options={[
              { value: "sale", label: "For sale" },
              { value: "rent", label: "For lease" },
            ]}
          />
          <Checkbox label="Only show featured residences" />
        </div>
      </Sheet>
    </div>
  );
}

export function FavoriteDemo({ label }: { label: string }) {
  const [saved, setSaved] = useState(false);
  return (
    <motion.button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${label} from favorites` : `Save ${label} to favorites`}
      onClick={() => setSaved((v) => !v)}
      whileTap={{ scale: 0.9 }}
      transition={spring.press}
      className={cn(
        "grid size-10 place-items-center rounded-full shadow-lift transition-colors duration-500 ease-settle",
        saved ? "bg-ink text-paper" : "bg-paper-raised text-ink hover:bg-white",
      )}
    >
      <HeartStraight size={16} weight={saved ? "fill" : "light"} />
    </motion.button>
  );
}

export function WordmarkDemo() {
  const [run, setRun] = useState(0);
  return (
    <div className="flex flex-col items-start gap-8">
      <Wordmark key={run} animated className="text-[clamp(2.5rem,4.6vw,4.5rem)]" />
      <Button variant="ghost" size="sm" onClick={() => setRun((n) => n + 1)}>
        <span className="flex items-center gap-2">
          <ArrowCounterClockwise aria-hidden size={14} weight="light" /> Replay the draw
        </span>
      </Button>
    </div>
  );
}
