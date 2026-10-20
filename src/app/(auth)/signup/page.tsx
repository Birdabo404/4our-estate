import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SignupForm } from "@/components/auth/signup-form";
import { Eyebrow } from "@/components/ui/eyebrow";
import { dashboardPath, safeNext } from "@/lib/auth/paths";
import { getViewer } from "@/lib/data/viewer";
import type { SignupRole } from "@/lib/domain/types";

export const metadata: Metadata = { title: "Create an account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; role?: string | string[] }>;
}) {
  const viewer = await getViewer();
  if (viewer.kind === "member") redirect(dashboardPath(viewer.role));

  const params = await searchParams;
  const rawNext = typeof params.next === "string" ? params.next : "";
  const next = safeNext(rawNext, "");
  const role: SignupRole = params.role === "agent" ? "agent" : "buyer";
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <div>
      <Eyebrow>Membership</Eyebrow>
      <h1 className="mt-4 text-display-3">
        Open an <em>account</em>.
      </h1>
      <p className="mt-4 text-lead text-ink-soft">Buyers keep a private list. Agents keep a desk.</p>
      <div className="mt-6">
        <SignupForm next={next || undefined} initialRole={role} />
      </div>
      <p className="mt-8 text-small text-ink-soft">
        Already with us?{" "}
        <Link href={loginHref} className="text-accent underline decoration-accent/30 underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
