import type { InquiryStatus, ListingStatus } from "@/lib/domain/types";

export function greeting(now = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-PH", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "Asia/Manila",
    }).format(now),
  );
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function firstName(fullName: string): string {
  const [name] = fullName.trim().split(/\s+/);
  return name || "there";
}

export const TRANSITION_LABEL: Record<ListingStatus, string> = {
  draft: "Return to draft",
  pending: "Submit for review",
  published: "Publish",
  sold: "Mark sold",
  archived: "Archive",
};

export const TRANSITION_DONE: Record<ListingStatus, string> = {
  draft: "Returned to draft",
  pending: "Submitted for review",
  published: "Published",
  sold: "Marked sold",
  archived: "Archived",
};

export function transitionNeedsConfirm(to: ListingStatus): boolean {
  return to === "sold" || to === "archived";
}

export const TRANSITION_CONFIRM: Partial<Record<ListingStatus, { title: string; body: string }>> = {
  sold: {
    title: "Mark this residence sold?",
    body: "It leaves the active catalog and stays on the public record as sold.",
  },
  archived: {
    title: "Archive this residence?",
    body: "It leaves the site. You can return it to a draft later.",
  },
};

export function primaryTransition(targets: readonly ListingStatus[]): ListingStatus | undefined {
  return targets.find((status) => !transitionNeedsConfirm(status));
}

export const INQUIRY_NEXT: Partial<Record<InquiryStatus, InquiryStatus>> = {
  new: "contacted",
  contacted: "closed",
};

export const INQUIRY_ACTION: Record<InquiryStatus, string> = {
  new: "Mark as new",
  contacted: "Mark contacted",
  closed: "Close inquiry",
};
