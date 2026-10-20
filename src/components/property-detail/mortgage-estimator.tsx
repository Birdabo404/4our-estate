"use client";

import { motion, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect, useId, useState } from "react";
import { SegmentedControl } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { formatPhp } from "@/lib/format";
import { spring } from "@/lib/motion";
import { DOWN_PAYMENT, estimate, RATE_PRESETS, type RatePreset, TERM_YEARS } from "./mortgage";

function RangeField({
  label,
  value,
  min,
  max,
  step,
  display,
  valueText,
  ends,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  valueText: string;
  ends: [string, string];
  onChange: (value: number) => void;
}) {
  const id = useId();
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-small text-ink-soft">
          {label}
        </label>
        <span className="tabular text-small text-ink">{display}</span>
      </div>
      <div className="relative h-6">
        <div aria-hidden className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-ink/15" />
        <motion.div
          aria-hidden
          className="absolute left-0 top-1/2 h-px w-full origin-left -translate-y-1/2 bg-accent"
          initial={false}
          animate={{ scaleX: fill / 100 }}
          transition={spring.ui}
        />
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={valueText}
          onChange={(event) => onChange(Number(event.target.value))}
          className={cn(
            "absolute inset-0 w-full cursor-pointer appearance-none bg-transparent",
            "[&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-paper-raised [&::-webkit-slider-thumb]:shadow-lift [&::-webkit-slider-thumb]:ring-1 [&::-webkit-slider-thumb]:ring-accent/60",
            "[&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-paper-raised [&::-moz-range-thumb]:shadow-lift",
            "focus-visible:outline-none focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-accent",
          )}
        />
      </div>
      <div aria-hidden className="tabular flex justify-between text-[0.75rem] text-ink-muted">
        <span>{ends[0]}</span>
        <span>{ends[1]}</span>
      </div>
    </div>
  );
}

function MonthlyFigure({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const spring = useSpring(value, { visualDuration: 0.5, bounce: 0 });
  const text = useTransform(spring, (n) => formatPhp(Math.round(n)).replace("₱", ""));

  useEffect(() => {
    if (reduced) spring.jump(value);
    else spring.set(value);
  }, [value, reduced, spring]);

  return (
    <span aria-hidden className="inline-flex items-baseline font-display text-[clamp(2.5rem,1.9rem+1.8vw,3.5rem)] leading-none tracking-[-0.01em]">
      <span className="mr-[0.06em] text-[0.7em]">₱</span>
      <motion.span className="tabular">{text}</motion.span>
      <span className="ml-2 font-sans text-[0.32em] tracking-[0.04em] text-ink-muted">/mo</span>
    </span>
  );
}

export function MortgageEstimator({ price }: { price: number }) {
  const [downPercent, setDownPercent] = useState<number>(DOWN_PAYMENT.initial);
  const [years, setYears] = useState<number>(TERM_YEARS.initial);
  const [presetId, setPresetId] = useState<RatePreset["id"]>("bank-fixed-1");
  const preset = RATE_PRESETS.find((p) => p.id === presetId) ?? RATE_PRESETS[0];
  const result = estimate(price, downPercent, preset.annualRate, years);
  const principalShare = result.principal / (result.principal + result.totalInterest);
  const overCap = preset.loanCap !== null && result.principal > preset.loanCap;

  const rate = (
    <div className="flex flex-col gap-3">
      <span aria-hidden className="text-small text-ink-soft">
        Interest rate
      </span>
      <SegmentedControl
        name="rate"
        size="sm"
        aria-label="Interest rate"
        value={presetId}
        onValueChange={setPresetId}
        className="flex w-full [&>label]:flex-1 [&>label]:px-2"
        options={RATE_PRESETS.map((p) => ({
          value: p.id,
          label: (
            <span className="flex flex-col items-center py-0.5 text-center leading-tight">
              <span className="tabular whitespace-nowrap">
                {p.label} {p.annualRate}%
              </span>
              <span className="text-[0.6875rem] font-normal opacity-70">{p.detail}</span>
            </span>
          ),
        }))}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-12">
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:items-end md:gap-12">
        <div className="flex flex-col gap-3">
          <span className="text-micro uppercase text-ink-muted">Estimated amortization</span>
          <output aria-live="polite" className="block">
            <span className="sr-only">{formatPhp(Math.round(result.monthly))} per month</span>
            <MonthlyFigure value={result.monthly} />
          </output>
          <p className="text-small text-ink-soft">
            On a loan of <span className="tabular text-ink">{formatPhp(result.principal)}</span> over {years} years at {preset.annualRate}%.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <div aria-hidden className="flex h-2 overflow-hidden rounded-[2px] bg-accent-soft/40">
            <motion.div
              className="h-full w-full origin-left bg-accent"
              initial={false}
              animate={{ scaleX: principalShare }}
              transition={spring.ui}
            />
          </div>
          <dl className="grid grid-cols-2 gap-4 text-small">
            <div className="flex flex-col gap-1">
              <dt className="flex items-center gap-2 text-ink-muted">
                <span aria-hidden className="size-1.5 rounded-full bg-accent" />
                Principal
              </dt>
              <dd className="tabular text-ink">{formatPhp(result.principal, "compact")}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="flex items-center gap-2 text-ink-muted">
                <span aria-hidden className="size-1.5 rounded-full bg-accent-soft" />
                Interest over term
              </dt>
              <dd className="tabular text-ink">{formatPhp(result.totalInterest, "compact")}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="grid gap-x-12 gap-y-9 border-t border-ink/10 pt-10 sm:grid-cols-2">
        <RangeField
          label="Down payment"
          value={downPercent}
          min={DOWN_PAYMENT.min}
          max={DOWN_PAYMENT.max}
          step={DOWN_PAYMENT.step}
          display={`${downPercent}% · ${formatPhp(result.downPayment, "compact")}`}
          valueText={`${downPercent} percent, ${formatPhp(result.downPayment)}`}
          ends={[`${DOWN_PAYMENT.min}%`, `${DOWN_PAYMENT.max}%`]}
          onChange={setDownPercent}
        />
        <RangeField
          label="Term"
          value={years}
          min={TERM_YEARS.min}
          max={TERM_YEARS.max}
          step={TERM_YEARS.step}
          display={`${years} years`}
          valueText={`${years} years`}
          ends={[`${TERM_YEARS.min} yrs`, `${TERM_YEARS.max} yrs`]}
          onChange={setYears}
        />
        <div className="sm:col-span-2">{rate}</div>
        <p className="max-w-[60ch] text-[0.8125rem] leading-relaxed text-ink-muted sm:col-span-2">
          {overCap
            ? `Pag-IBIG lends up to ${formatPhp(preset.loanCap ?? 0, "compact")}. A bank would finance the balance, so read this as a floor rather than a quote.`
            : "Indicative only. Banks reprice after the fixed period and add fire and mortgage redemption insurance to the monthly figure."}
        </p>
      </div>
    </div>
  );
}
