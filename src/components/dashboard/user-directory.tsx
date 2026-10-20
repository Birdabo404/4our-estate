"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";

import { setUserRole } from "@/lib/actions/admin";
import { ROLES, type Role } from "@/lib/domain/types";
import type { DirectoryUser } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

import { FormAlert } from "./form-alert";
import { ROLE_LABEL } from "./nav";

type RoleChoice = { user: DirectoryUser; role: Role };

export function UserDirectory({ users }: { users: DirectoryUser[] }) {
  const [selected, setSelected] = useState<RoleChoice | null>(null);
  const close = useCallback(() => setSelected(null), []);

  return (
    <>
      <ul aria-label="People">
        {users.map((user) => (
          <li key={user.id} className="flex flex-col gap-4 border-t border-ink/10 py-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-display text-title">{user.fullName}</p>
              <p className="mt-1 truncate text-small text-ink-muted">{user.email}</p>
              {user.agency ? <p className="mt-1 text-small text-ink-soft">{user.agency}</p> : null}
            </div>
            <div className="flex items-center gap-4">
              <p className="text-small text-ink">{ROLE_LABEL[user.role]}</p>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelected({ user, role: user.role })}>
                Change role
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <RoleDialog selected={selected} onRole={(role) => setSelected((current) => (current ? { ...current, role } : current))} onClose={close} />
    </>
  );
}

function RoleDialog({
  selected,
  onRole,
  onClose,
}: {
  selected: RoleChoice | null;
  onRole: (role: Role) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [state, action, pending] = useActionState(setUserRole, null);
  const reported = useRef(state);
  const user = selected?.user ?? null;
  const role = selected?.role ?? "buyer";

  useEffect(() => {
    if (!state || state === reported.current) return;
    reported.current = state;
    if (!state.ok) return;
    toast({ title: `Role set to ${ROLE_LABEL[state.data.role]}`, tone: "positive" });
    onClose();
    router.refresh();
  }, [state, toast, router, onClose]);

  const formError = state && !state.ok ? state.formError : undefined;

  return (
    <Dialog
      open={user !== null}
      onClose={onClose}
      title={user ? `Role for ${user.fullName}` : "Role"}
      description="An admin appoints every role. The last admin cannot be removed."
      footer={
        user ? (
          <>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <form action={action}>
              <input type="hidden" name="userId" value={user.id} />
              <input type="hidden" name="role" value={role} />
              <Button type="submit" disabled={pending || role === user.role}>
                {pending ? "Saving…" : "Confirm role"}
              </Button>
            </form>
          </>
        ) : null
      }
    >
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">Role</legend>
        {ROLES.map((option) => (
          <label key={option} className="flex items-center gap-3 text-small text-ink">
            <input
              type="radio"
              name="role-choice"
              value={option}
              checked={role === option}
              onChange={() => onRole(option)}
              className="size-4 accent-ink"
            />
            {ROLE_LABEL[option]}
          </label>
        ))}
      </fieldset>
      <div className="mt-5">
        <FormAlert message={formError} />
      </div>
    </Dialog>
  );
}
