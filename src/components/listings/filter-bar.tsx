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
    <span aria-hidden className="pointer-events-none absolute inset-x-8 bottom-0 h-px overflow-hidden">
      <motion.span
        className="absolute inset-0 origin-left bg-accent"
        initial={false}
        animate={pending ? { scaleX: 0.85, opacity: 1 } : { scaleX: 1, opacity: 0 }}
        transition={pending ? { duration: duration.cinematic * 2, ease: ease.reveal } : { duration: duration.base, ease: ease.settle }}
      />
    </span>
  );
}

const Divider = () => <span aria-hidden className="h-8 w-px shrink-0 bg-ink/10" />;

export function FilterBar() {
  const controls = useSelectControls();
  const { filters, total, pending, update } = useListingFilters();
  const [open, setOpen] = useState(false);
  const activeCount = activeChips(filters).filter((chip) => chip.id !== "q").length;

  return (
    <div className="sticky top-[5.25rem] z-[calc(var(--z-nav)-1)] md:top-[5.5rem]">
      <div className="rounded-full bg-ink/[0.035] p-1.5 shadow-float ring-1 ring-ink/[0.06] backdrop-blur-xl">
        <div className="relative flex items-center gap-1 rounded-full bg-paper-raised/95 p-1 shadow-[inset_0_1px_0_rgb(255_255_255/0.8)]">
          <KeywordSearch className="min-w-0 flex-1 lg:max-w-[22rem]" />

          <div className="hidden items-center gap-1 lg:flex lg:flex-1 lg:justify-end">
            <Divider />
            <ListingTypeControl className="mx-2 shrink-0" />
            <Divider />
            {controls.map((spec) => (
              <QuietSelect key={spec.id} spec={spec} className="w-[9.5rem] xl:w-[11rem]" />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            className="relative flex h-12 shrink-0 items-center gap-2.5 rounded-full bg-ink pl-4 pr-5 text-small font-medium text-paper transition-colors duration-500 ease-settle hover:bg-[#2b2620] lg:hidden"
          >
            <Faders aria-hidden size={16} weight="light" />
            Filters
            {activeCount > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-paper text-[0.6875rem] text-ink tabular">{activeCount}</span>
            )}
          </button>
          <PendingLine />
        </div>
      </div>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        side="bottom"
        title="Refine the collection"
        description="Every change applies at once. The count below updates as you go."
        footer={
          <>
            <Button variant="ghost" onClick={() => update(CLEAR_ALL)} disabled={activeCount === 0 && !filters.q}>
              Clear all
            </Button>
            <Button onClick={() => setOpen(false)} icon="arrow-right">
              {pending ? "Updating" : `Show ${total} ${total === 1 ? "residence" : "residences"}`}
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
        <p aria-live="polite" className="text-small text-ink-soft">
          <span className="tabular font-medium text-ink">{total}</span> {total === 1 ? "residence" : "residences"}
          <AnimatePresence>
            {pending && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: tween.settle }}
                exit={{ opacity: 0, transition: tween.exit }}
                className="ml-3 text-ink-muted"
              >
                Updating
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
                  className="group inline-flex h-9 items-center gap-2 rounded-full bg-paper-raised pl-4 pr-2 text-small text-ink ring-1 ring-inset ring-ink/12 transition-[box-shadow,background-color] duration-300 ease-settle hover:ring-ink/30"
                >
                  {chip.label}
                  <span className="grid size-5 place-items-center rounded-full bg-ink/[0.06] text-ink-soft transition-colors duration-300 ease-settle group-hover:bg-ink group-hover:text-paper">
                    <X aria-hidden size={10} weight="light" />
                  </span>
                </button>
              </motion.li>
            ))}
            <motion.li key="clear" layout>
              <button
                type="button"
                onClick={() => update(CLEAR_ALL)}
                className={cn(
                  "h-9 rounded-full px-3 text-small text-accent underline decoration-accent/30 underline-offset-4",
                  "transition-colors duration-300 ease-settle hover:decoration-accent",
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
