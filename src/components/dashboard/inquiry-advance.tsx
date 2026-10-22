"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";

import { updateInquiryStatus } from "@/lib/actions/inquiries";
import type { Inquiry } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

import { INQUIRY_ACTION, INQUIRY_NEXT } from "./copy";

export function InquiryAdvance({ inquiry }: { inquiry: Inquiry }) {
  const next = INQUIRY_NEXT[inquiry.status];
  const router = useRouter();
  const { toast } = useToast();
  const [state, action, pending] = useActionState(updateInquiryStatus, null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast({
        title: state.data.status === "contacted" ? "Marked contacted" : "Inquiry closed",
        tone: "positive",
      });
      router.refresh();
      return;
    }
    toast({ title: state.formError ?? "Could not update the inquiry.", tone: "danger" });
  }, [state, toast, router]);

  if (!next) return null;

  return (
    <form action={action} className="mt-3">
      <input type="hidden" name="id" value={inquiry.id} />
      <input type="hidden" name="status" value={next} />
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        {pending ? "Saving…" : INQUIRY_ACTION[next]}
      </Button>
    </form>
  );
}
