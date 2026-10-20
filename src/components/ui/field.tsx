"use client";

import { CaretDown, Check, WarningCircle } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion } from "framer-motion";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useId,
  useState,
} from "react";
import { cn } from "@/lib/cn";
import { spring, tween } from "@/lib/motion";

type FieldContextValue = {
  id: string;
  hintId: string | undefined;
  errorId: string | undefined;
  invalid: boolean;
  required: boolean;
};

const FieldContext = createContext<FieldContextValue | null>(null);

/** zod's `flatten().fieldErrors` yields `string[]`; a single message also works. */
export type FieldErrorValue = string | readonly string[] | undefined;

function firstError(error: FieldErrorValue): string | undefined {
  return typeof error === "string" ? error : error?.[0];
}

export function Field({
  label,
  hint,
  error,
  required = false,
  className,
  children,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  error?: FieldErrorValue;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const id = useId();
  const message = firstError(error);
  const ctx: FieldContextValue = {
    id,
    hintId: hint ? `${id}-hint` : undefined,
    errorId: message ? `${id}-error` : undefined,
    invalid: Boolean(message),
    required,
  };
  return (
    <FieldContext.Provider value={ctx}>
      <div className={cn("flex flex-col gap-2.5", className)}>
        {label && <Label>{label}</Label>}
        {children}
        {hint && <FieldHint>{hint}</FieldHint>}
        <FieldError>{message}</FieldError>
      </div>
    </FieldContext.Provider>
  );
}

function useFieldControl<P extends { id?: string; "aria-describedby"?: string; "aria-invalid"?: ComponentProps<"input">["aria-invalid"]; required?: boolean }>(props: P): P {
  const ctx = useContext(FieldContext);
  if (!ctx) return props;
  const describedBy = [props["aria-describedby"], ctx.hintId, ctx.errorId].filter(Boolean).join(" ");
  return {
    ...props,
    id: props.id ?? ctx.id,
    required: props.required ?? ctx.required,
    "aria-invalid": props["aria-invalid"] ?? (ctx.invalid || undefined),
    "aria-describedby": describedBy || undefined,
  };
}

export function Label({ className, children, ...rest }: ComponentProps<"label">) {
  const ctx = useContext(FieldContext);
  return (
    <label
      htmlFor={rest.htmlFor ?? ctx?.id}
      className={cn("flex items-baseline justify-between text-small font-medium text-ink", className)}
      {...rest}
    >
      <span>{children}</span>
      {ctx?.required && <span className="text-micro font-normal uppercase text-ink-muted">Required</span>}
    </label>
  );
}

export function FieldHint({ className, children }: { className?: string; children: ReactNode }) {
  const ctx = useContext(FieldContext);
  return (
    <p id={ctx?.hintId} className={cn("text-small text-ink-muted", className)}>
      {children}
    </p>
  );
}

export function FieldError({ className, children }: { className?: string; children?: ReactNode }) {
  const ctx = useContext(FieldContext);
  return (
    <div aria-live="polite" className="empty:hidden">
      <AnimatePresence initial={false}>
        {children && (
          <motion.p
            key="error"
            id={ctx?.errorId}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0, transition: tween.settle }}
            exit={{ opacity: 0, transition: tween.exit }}
            className={cn("flex items-start gap-2 text-small text-danger", className)}
          >
            <WarningCircle aria-hidden size={16} weight="regular" className="mt-[0.2em] shrink-0" />
            <span>{children}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const control = cn(
  "w-full rounded-field bg-paper-raised text-body text-ink ring-1 ring-inset ring-ink/15",
  "placeholder:text-ink-muted",
  "transition-[box-shadow,background-color] duration-300 ease-settle",
  "hover:ring-ink/25",
  "focus-visible:bg-white focus-visible:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink",
  "aria-invalid:ring-danger/60 aria-invalid:focus-visible:ring-danger",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, "h-12 px-4", className)} {...useFieldControl(props)} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-36 resize-y px-4 py-3.5 leading-relaxed", className)} {...useFieldControl(props)} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(control, "h-12 cursor-pointer appearance-none pl-4 pr-11", className)} {...useFieldControl(props)}>
        {children}
      </select>
      <CaretDown
        aria-hidden
        size={14}
        weight="regular"
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted"
      />
    </div>
  );
}

export function Checkbox({
  label,
  description,
  className,
  ...props
}: Omit<ComponentProps<"input">, "type"> & { label: ReactNode; description?: ReactNode }) {
  const fallbackId = useId();
  const wired = useFieldControl(props);
  const id = wired.id ?? fallbackId;
  const descriptionId = description ? `${id}-description` : undefined;
  return (
    <div className={cn("flex items-start gap-3.5", className)}>
      <span className="relative mt-[0.15em] grid size-5 shrink-0 place-items-center">
        <input
          type="checkbox"
          {...wired}
          id={id}
          aria-describedby={[wired["aria-describedby"], descriptionId].filter(Boolean).join(" ") || undefined}
          className={cn(
            "peer size-5 cursor-pointer appearance-none rounded-[0.25rem] bg-paper-raised ring-1 ring-inset ring-ink/25",
            "transition-[background-color,box-shadow] duration-300 ease-settle",
            "checked:bg-accent checked:ring-ink hover:ring-ink/45",
            "aria-invalid:ring-danger/70",
          )}
        />
        <Check
          aria-hidden
          size={12}
          weight="regular"
          className="pointer-events-none absolute scale-50 text-ink opacity-0 transition-[opacity,transform] duration-300 ease-settle peer-checked:scale-100 peer-checked:opacity-100"
        />
      </span>
      <span className="flex flex-col gap-1">
        <label htmlFor={id} className="cursor-pointer text-small text-ink">
          {label}
        </label>
        {description && (
          <span id={descriptionId} className="text-small text-ink-muted">
            {description}
          </span>
        )}
      </span>
    </div>
  );
}

export type SegmentOption<V extends string> = { value: V; label: ReactNode };

/**
 * A radio group styled as a segmented control. Native radios keep arrow-key
 * navigation and form submission; the sliding thumb is a shared layout element.
 */
export function SegmentedControl<V extends string>({
  name,
  options,
  value,
  defaultValue,
  onValueChange,
  "aria-label": ariaLabel,
  size = "md",
  className,
}: {
  name: string;
  options: ReadonlyArray<SegmentOption<V>>;
  value?: V;
  defaultValue?: V;
  onValueChange?: (value: V) => void;
  "aria-label"?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const id = useId();
  const [uncontrolled, setUncontrolled] = useState<V | undefined>(defaultValue ?? options[0]?.value);
  const current = value ?? uncontrolled;
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("inline-flex rounded-md bg-ink/[0.06] p-1", className)}
    >
      {options.map((option) => {
        const checked = option.value === current;
        const optionId = `${id}-${option.value}`;
        return (
          <label
            key={option.value}
            htmlFor={optionId}
            className={cn(
              "relative cursor-pointer select-none rounded-[0.3rem] font-semibold transition-colors duration-300 ease-settle",
              "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-ink",
              size === "sm" ? "px-4 py-1.5 text-small" : "px-5 py-2.5 text-small",
              checked ? "text-paper" : "text-ink-soft hover:text-ink",
            )}
          >
            <input
              id={optionId}
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              onChange={() => {
                setUncontrolled(option.value);
                onValueChange?.(option.value);
              }}
              className="sr-only"
            />
            {checked && (
              <motion.span
                layoutId={`${id}-thumb`}
                transition={spring.ui}
                aria-hidden
                className="absolute inset-0 rounded-[0.3rem] bg-ink"
              />
            )}
            <span className="relative">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}
