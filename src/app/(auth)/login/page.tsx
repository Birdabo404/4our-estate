import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { Eyebrow } from "@/components/ui/eyebrow";
import { dashboardPath, safeNext } from "@/lib/auth/paths";
import { getViewer } from "@/lib/data/viewer";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const viewer = await getViewer();
  if (viewer.kind === "member") redirect(dashboardPath(viewer.role));

  const params = await searchParams;
  const raw = typeof params.next === "string" ? params.next : "";
  const next = safeNext(raw, "");
  const signupHref = next ? `/signup?next=${encodeURIComponent(next)}` : "/signup";

  return (
    <div>
      <Eyebrow>Members</Eyebrow>
      <h1 className="mt-5 text-display-3">
        Welcome <em>back</em>.
      </h1>
      <p className="mt-4 text-lead text-ink-soft">Sign in to the residences you saved and the desk you keep.</p>
      <div className="mt-10">
        <LoginForm next={next || undefined} />
      </div>
      <p className="mt-8 text-small text-ink-soft">
        New to 4OUR?{" "}
        <Link href={signupHref} className="text-accent underline decoration-accent/30 underline-offset-4">
          Create an account
        </Link>
      </p>
    </div>
  );
}
