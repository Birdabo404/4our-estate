"use client";

import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode, useEffect, useState } from "react";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { InquiryForm, type InquiryAgent } from "@/components/inquiry/inquiry-form";
import { Price } from "@/components/property/price";
import { Button, ButtonLink } from "@/components/ui/button";
import { Sheet } from "@/components/ui/dialog";
import type { ListingType } from "@/lib/domain/types";
import { spring, tween } from "@/lib/motion";

export type EnquireProps = {
  propertyId: string;
  title: string;
  listingType: ListingType;
  pricePhp: number;
  agent: InquiryAgent;
  defaults: { name: string; email: string };
};

/** Hides while the site footer is on screen so the bar never covers it. */
function useFooterInView(): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const footer = document.querySelector("body footer");
    if (!footer) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? false));
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);
  return inView;
}

function Bar({ children }: { children: ReactNode }) {
  const footerInView = useFooterInView();
  return (
    <AnimatePresence initial={false}>
      {!footerInView && (
        <motion.div
          key="bar"
          initial={{ y: "110%" }}
          animate={{ y: 0, transition: spring.panel }}
          exit={{ y: "110%", transition: tween.exit }}
          className="fixed inset-x-0 bottom-0 z-(--z-nav) px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
        >
          <div className="flex items-center justify-between gap-4 rounded-full bg-paper-raised/95 py-2 pl-6 pr-2 shadow-float ring-1 ring-ink/[0.08] backdrop-blur-md">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function MobileEnquireBar(props: EnquireProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Bar>
        <div className="flex min-w-0 flex-col">
          <span className="text-micro uppercase text-ink-muted">{props.listingType === "rent" ? "Lease" : "Asking"}</span>
          <Price amount={props.pricePhp} listingType={props.listingType} style="compact" size="sm" />
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton propertyId={props.propertyId} title={props.title} tone="image" className="shadow-none ring-ink/15" />
          <Button size="md" onClick={() => setOpen(true)} aria-haspopup="dialog">
            Enquire
          </Button>
        </div>
      </Bar>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        side="bottom"
        title={`Enquire with ${props.agent.firstName}`}
        description={props.title}
      >
        <InquiryForm
          propertyId={props.propertyId}
          propertyTitle={props.title}
          agent={props.agent}
          defaults={props.defaults}
          layout="sheet"
        />
      </Sheet>
    </>
  );
}

export function MobileSoldBar({ href }: { href: string }) {
  return (
    <Bar>
      <span className="font-display text-title italic">Sold</span>
      <ButtonLink href={href} size="md" icon={href.startsWith("#") ? "arrow-down" : "arrow-right"}>
        Similar homes
      </ButtonLink>
    </Bar>
  );
}
