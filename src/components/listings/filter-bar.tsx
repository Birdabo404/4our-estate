"use client";

import { Faders, X } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/dialog";
import { Field, Select } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { duration, ease, spring, tween } from "@/lib/motion";
import { KeywordSearch, ListingTypeControl, QuietSelect, SortSelect, useSelectControls } from "./filter-controls";
import { useListingFilters } from "./filter-state";
import { activeChips, CLEAR_ALL } from "./filters";

function PendingLine() {
  const { pending } = useListingFilters();
  return (
    <span aria-hidden className="pointer-events-none absolute inset-x-3 bottom-0 h-0.5 overflow-hidden">
      <motion.span
        className="absolute inset-0 origin-left bg-accent"
        initial={false}
        animate={pending ? { scaleX: 0.85, opacity: 1 } : { scaleX: 1, opacity: 0 }}
        transition={pending ? { duration: duration.cinematic * 2, ease: ease.reveal } : { duration: duration.base, ease: ease.settle }}
      />
    </span>
  );
}

const Divider = () => <span aria-hidden className="h-8 w-px shrink-0 bg-white/10" />;

export function FilterBar() {
  const controls = useSelectControls();
  const { filters, total, pending, update } = useListingFilters();
  const [open, setOpen] = useState(false);
  const activeCount = activeChips(filters).filter((chip) => chip.id !== "q").length;

  return (
    <div className="sticky top-[calc(var(--nav-height)+0.75rem)] z-[calc(var(--z-nav)-1)]">
      <div className="relative flex items-center gap-1.5 rounded-panel bg-night p-1.5 text-on-night shadow-float ring-1 ring-white/5">
        <KeywordSearch className="min-w-0 flex-1 lg:max-w-[22rem]" />

        <div className="hidden items-center gap-1 lg:flex lg:flex-1 lg:justify-end">
          <ListingTypeControl tone="night" className="mx-1.5 shrink-0" />
          <Divider />
          {controls.map((spec) => (
            <QuietSelect key={spec.id} spec={spec} className="w-[9rem] xl:w-[10.5rem]" />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="relative flex h-12 shrink-0 items-center gap-2.5 rounded-md bg-accent pl-4 pr-4 text-small font-semibold text-ink transition-colors duration-300 ease-settle hover:bg-accent-soft lg:hidden"
        >
          <Faders aria-hidden size={16} weight="bold" />
          Filters
          {activeCount > 0 && (
            <span className="grid size-5 place-items-center rounded-[0.25rem] bg-ink font-mono text-[0.6875rem] text-paper tabular">{activeCount}</span>
          )}
        </button>
        <PendingLine />
      </div>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        side="bottom"
        title="Filter homes"
        description="Changes apply right away. The count on the button updates as you go."
        footer={
          <>
            <Button variant="ghost" onClick={() => update(CLEAR_ALL)} disabled={activeCount === 0 && !filters.q}>
              Clear all
            </Button>
            <Button onClick={() => setOpen(false)} icon="arrow-right">
              {pending ? "Updating" : `Show ${total} ${total === 1 ? "home" : "homes"}`}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-6">
          <ListingTypeControl size="md" className="self-start" />
          <div className="grid gap-5 sm:grid-cols-2">
            {controls.map((spec) => (
              <Field key={spec.id} label={spec.label}>
                <Select value={spec.value} disabled={spec.disabled} onChange={(event) => spec.onChange(event.target.value)}>
                  {spec.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
            ))}
          </div>
        </div>
      </Sheet>
    </div>
  );
}

export function ResultsHeader() {
  const { filters, total, pending, update } = useListingFilters();
  const chips = activeChips(filters);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p aria-live="polite" className="font-mono text-[0.8125rem] text-ink-soft">
          <span className="tabular rounded-[0.25rem] bg-ink px-1.5 py-0.5 font-semibold text-paper">{total}</span>{" "}
          {total === 1 ? "home matches" : "homes match"}
          <AnimatePresence>
            {pending && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: tween.settle }}
                exit={{ opacity: 0, transition: tween.exit }}
                className="ml-3 text-accent-ink"
              >
                updating…
              </motion.span>
            )}
          </AnimatePresence>
        </p>
        <SortSelect />
      </div>

      {chips.length > 0 && (
        <ul aria-label="Active filters" className="flex flex-wrap items-center gap-2">
          <AnimatePresence initial={false} mode="popLayout">
            {chips.map((chip) => (
              <motion.li
                key={chip.id}
                layout
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1, transition: spring.ui }}
                exit={{ opacity: 0, scale: 0.94, transition: tween.exit }}
              >
                <button
                  type="button"
                  onClick={() => update(chip.clear)}
                  aria-label={`Remove filter: ${chip.label}`}
                  className="group inline-flex h-9 items-center gap-2 rounded-md bg-sky pl-3 pr-1.5 text-small font-semibold text-ink ring-1 ring-inset ring-ink/10 transition-[box-shadow,background-color] duration-300 ease-settle hover:ring-ink"
                >
                  {chip.label}
                  <span className="grid size-6 place-items-center rounded-[0.25rem] bg-paper-raised text-ink transition-colors duration-300 ease-settle group-hover:bg-ink group-hover:text-paper">
                    <X aria-hidden size={11} weight="bold" />
                  </span>
                </button>
              </motion.li>
            ))}
            <motion.li key="clear" layout>
              <button
                type="button"
                onClick={() => update(CLEAR_ALL)}
                className={cn(
                  "h-9 rounded-md px-3 text-small font-semibold text-accent-ink underline decoration-accent-ink/30 underline-offset-4",
                  "transition-colors duration-300 ease-settle hover:decoration-accent-ink",
                )}
              >
                Clear all
              </button>
            </motion.li>
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
