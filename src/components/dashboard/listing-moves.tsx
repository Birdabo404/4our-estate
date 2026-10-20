"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";

import { transitionListing } from "@/lib/actions/listings";
import { nextStatuses, type ListingStatus, type Role } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

import { primaryTransition, TRANSITION_CONFIRM, TRANSITION_DONE, TRANSITION_LABEL, transitionNeedsConfirm } from "./copy";

export function ListingMoves({
  id,
  status,
  role,
}: {
  id: string;
  status: ListingStatus;
  role: Role;
}) {
  const targets = nextStatuses(status, role);
  const forward = primaryTransition(status, targets);
  const [confirming, setConfirming] = useState<ListingStatus | null>(null);
  const closeConfirm = useCallback(() => setConfirming(null), []);

  if (targets.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {targets.map((to) =>
        transitionNeedsConfirm(to) ? (
          <Button key={to} type="button" size="sm" variant="ghost" onClick={() => setConfirming(to)}>
            {TRANSITION_LABEL[to]}
          </Button>
        ) : (
          <DirectMove key={to} id={id} to={to} primary={to === forward} />
        ),
      )}
      <Dialog
        open={confirming !== null}
        onClose={closeConfirm}
        title={confirming ? TRANSITION_CONFIRM[confirming]?.title : "Confirm"}
        description={confirming ? TRANSITION_CONFIRM[confirming]?.body : undefined}
        footer={
          confirming ? (
            <ConfirmMove id={id} to={confirming} onDone={closeConfirm} onCancel={closeConfirm} />
          ) : null
        }
      />
    </div>
  );
}

function DirectMove({ id, to, primary }: { id: string; to: ListingStatus; primary: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [state, action, pending] = useActionState(transitionListing, null);
  const reported = useRef(state);

  useEffect(() => {
    if (!state || state === reported.current) return;
    reported.current = state;
    if (state.ok) {
      toast({ title: TRANSITION_DONE[state.data.status], tone: "positive" });
      router.refresh();
      return;
    }
    toast({ title: state.formError ?? "That status change is not allowed.", tone: "danger" });
  }, [state, toast, router]);

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="to" value={to} />
      <Button type="submit" size="sm" variant={primary ? "primary" : "ghost"} disabled={pending}>
        {pending ? "Saving…" : TRANSITION_LABEL[to]}
      </Button>
    </form>
  );
}

function ConfirmMove({
  id,
  to,
  onDone,
  onCancel,
}: {
  id: string;
  to: ListingStatus;
  onDone: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [state, action, pending] = useActionState(transitionListing, null);
  const reported = useRef(state);

  useEffect(() => {
    if (!state || state === reported.current) return;
    reported.current = state;
    if (state.ok) {
      toast({ title: TRANSITION_DONE[state.data.status], tone: "positive" });
      onDone();
      router.refresh();
      return;
    }
    toast({ title: state.formError ?? "That status change is not allowed.", tone: "danger" });
  }, [state, toast, router, onDone]);

  return (
    <>
      <Button type="button" variant="ghost" onClick={onCancel}>
        Keep it
      </Button>
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="to" value={to} />
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : TRANSITION_LABEL[to]}
        </Button>
      </form>
    </>
  );
}
