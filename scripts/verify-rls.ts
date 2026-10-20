import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  LISTING_STATUSES,
  LISTING_TRANSITIONS,
  type ListingStatus,
  type Role,
} from "../src/lib/domain/types";
import type { Database } from "../src/lib/supabase/database.types";

type Client = SupabaseClient<Database>;
type CheckResult = { name: string; pass: boolean; detail?: string };

const PASSWORD = "Estate!2026";
const PROBE_SLUG = "rls-probe-draft";
const PNG = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  ),
);

const results: CheckResult[] = [];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function check(name: string, run: () => Promise<void>) {
  try {
    await run();
    results.push({ name, pass: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    results.push({ name, pass: false, detail });
  }
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function client(key: string): Client {
  return createClient<Database>(required("NEXT_PUBLIC_SUPABASE_URL"), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function signIn(email: string): Promise<Client> {
  const supabase = client(required("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  if (error || !data.user) throw new Error(error?.message ?? `Could not sign in ${email}`);
  return supabase;
}

function expectedRoles(from: ListingStatus, to: ListingStatus): readonly Role[] | null {
  const moves = LISTING_TRANSITIONS[from] as Partial<Record<ListingStatus, readonly Role[]>>;
  return moves[to] ?? null;
}

async function main() {
  const service = client(required("SUPABASE_SERVICE_ROLE_KEY"));
  const guest = client(required("NEXT_PUBLIC_SUPABASE_ANON_KEY"));

  await service.from("inquiries").delete().like("email", "rls-%");
  await service.from("properties").delete().like("slug", "rls-%");

  const buyer = await signIn("camille.uy@4our.estate");
  const otherBuyer = await signIn("joaquin.tan@4our.estate");
  const agentA = await signIn("isabel.santos@4our.estate");
  const agentB = await signIn("mateo.cruz@4our.estate");
  const admin = await signIn("admin@4our.estate");

  const buyerId = (await buyer.auth.getUser()).data.user?.id;
  const otherBuyerId = (await otherBuyer.auth.getUser()).data.user?.id;
  const agentAId = (await agentA.auth.getUser()).data.user?.id;
  const agentBId = (await agentB.auth.getUser()).data.user?.id;
  const adminId = (await admin.auth.getUser()).data.user?.id;
  assert(buyerId && otherBuyerId && agentAId && agentBId && adminId, "Missing signed-in ids");

  let probeId = "";

  try {
    await check("transition rules match the domain table", async () => {
      const { data, error } = await service.from("listing_transition_rules").select("*");
      assert(!error, error?.message ?? "rules");
      const rows = data ?? [];
      for (const from of LISTING_STATUSES) {
        for (const to of LISTING_STATUSES) {
          if (from === to) continue;
          const expected = expectedRoles(from, to);
          const actual = rows.find((row) => row.from_status === from && row.to_status === to);
          if (!expected) {
            assert(!actual, `Unexpected rule ${from} -> ${to}`);
            continue;
          }
          assert(actual, `Missing rule ${from} -> ${to}`);
          const roles = [...actual.allowed_roles].sort();
          const wanted = [...expected].sort();
          assert(roles.join() === wanted.join(), `${from} -> ${to} roles differ`);
        }
      }
    });

    await check("guests see no drafts, pending, or archived listings", async () => {
      const { data, error } = await guest.from("properties").select("slug, status");
      assert(!error, error?.message ?? "select");
      const rows = data ?? [];
      assert(rows.length > 0, "Guest catalog is empty");
      assert(
        rows.every((row) => row.status === "published" || row.status === "sold"),
        "Guest saw a private status",
      );
      assert(
        !rows.some((row) => row.slug === "tagaytay-highlands-villa"),
        "Guest can see a draft",
      );
      assert(
        !rows.some((row) => row.slug === "bgc-park-west-lease"),
        "Guest can see an archived listing",
      );
    });

    await check("sold listings stay public", async () => {
      const { data, error } = await guest
        .from("properties")
        .select("slug")
        .eq("slug", "mactan-newtown-beachfront")
        .maybeSingle();
      assert(!error, error?.message ?? "sold");
      assert(data, "Guest cannot read the sold Mactan villa");
    });

    await check("images follow the listing", async () => {
      const draft = await service
        .from("properties")
        .select("id")
        .eq("slug", "tagaytay-highlands-villa")
        .single();
      const sold = await service
        .from("properties")
        .select("id")
        .eq("slug", "mactan-newtown-beachfront")
        .single();
      assert(draft.data && sold.data, "Seed listings missing");
      const hidden = await guest.from("property_images").select("id").eq("property_id", draft.data.id);
      const shown = await guest.from("property_images").select("id").eq("property_id", sold.data.id);
      assert(!hidden.error && (hidden.data ?? []).length === 0, "Guest can see draft photos");
      assert(!shown.error && (shown.data ?? []).length >= 4, "Guest cannot see sold photos");
    });

    await check("only agents with a public listing have a public profile", async () => {
      const { data, error } = await guest.from("profiles").select("id, role");
      assert(!error, error?.message ?? "profiles");
      const ids = (data ?? []).map((row) => row.id);
      assert(!ids.includes(buyerId), "Buyer profile is public");
      assert(!ids.includes(adminId), "Admin profile is public");
      assert(ids.includes(agentAId) && ids.includes(agentBId), "Agent profiles are hidden");
      assert((data ?? []).every((row) => row.role === "agent"), "A non-agent profile is public");
    });

    await check("a buyer cannot insert a property", async () => {
      const inserted = await buyer.from("properties").insert({
        slug: "rls-buyer-insert",
        agent_id: buyerId,
        title: "Buyer should fail",
        description: "This insert must be rejected by row level security.",
        listing_type: "sale",
        property_type: "house",
        price_php: 2_000_000,
        bedrooms: 1,
        bathrooms: 1,
        floor_area_sqm: 40,
        neighborhood: "Probe",
        city: "Makati",
        province: "Metro Manila",
        address: "1 Probe",
      });
      assert(inserted.error, "Buyer insert succeeded");
    });

    await check("a buyer cannot set their own role to admin", async () => {
      const updated = await buyer.from("profiles").update({ role: "admin" }).eq("id", buyerId);
      assert(updated.error, "Buyer role update succeeded");
      const profile = await buyer.from("profiles").select("role").eq("id", buyerId).single();
      assert(profile.data?.role === "buyer", "Buyer role changed");
    });

    await check("a buyer sees only their own inquiries", async () => {
      const { data, error } = await buyer.from("inquiries").select("id, buyer_id");
      assert(!error, error?.message ?? "inquiries");
      const rows = data ?? [];
      assert(rows.length > 0, "Buyer has no inquiries");
      assert(rows.every((row) => row.buyer_id === buyerId), "Buyer saw someone else's inquiry");
      const other = await otherBuyer.from("inquiries").select("id, buyer_id");
      assert((other.data ?? []).every((row) => row.buyer_id === otherBuyerId), "Other buyer leak");
      const buyerIds = new Set(rows.map((row) => row.id));
      const overlap = (other.data ?? []).some((row) => buyerIds.has(row.id));
      assert(!overlap, "Buyers share an inquiry row");
    });

    await check("an agent sees only inquiries on their own listings", async () => {
      const own = await agentA.from("inquiries").select("id, property_id");
      const other = await agentB.from("inquiries").select("id, property_id");
      assert(!own.error && !other.error, own.error?.message ?? other.error?.message ?? "inquiries");
      assert((own.data ?? []).length > 0, "Agent A has no inquiries");
      const ownIds = [...new Set((own.data ?? []).map((row) => row.property_id))];
      const otherIds = [...new Set((other.data ?? []).map((row) => row.property_id))];
      const props = await service.from("properties").select("id, agent_id").in("id", [...ownIds, ...otherIds]);
      assert(!props.error, props.error?.message ?? "properties");
      const agentByProperty = new Map((props.data ?? []).map((row) => [row.id, row.agent_id]));
      assert(ownIds.every((id) => agentByProperty.get(id) === agentAId), "Agent A saw another listing");
      assert(otherIds.every((id) => agentByProperty.get(id) === agentBId), "Agent B saw another listing");
      const shared = ownIds.some((id) => otherIds.includes(id));
      assert(!shared, "Agents share a listing's inquiries");
    });

    await check("agent A cannot edit agent B's listing", async () => {
      const before = await service
        .from("properties")
        .select("title")
        .eq("slug", "bgc-seasons-penthouse")
        .single();
      const updated = await agentA
        .from("properties")
        .update({ title: "Taken over" })
        .eq("slug", "bgc-seasons-penthouse")
        .select("id");
      const after = await service
        .from("properties")
        .select("title")
        .eq("slug", "bgc-seasons-penthouse")
        .single();
      assert((updated.data ?? []).length === 0, "Update returned a row");
      assert(after.data?.title === before.data?.title, "Title changed");
    });

    await check("agent creates a draft probe", async () => {
      const inserted = await agentA
        .from("properties")
        .insert({
          slug: PROBE_SLUG,
          agent_id: agentAId,
          title: "RLS probe house",
          description: "Probe listing used by the permission check and removed afterward.",
          listing_type: "sale",
          property_type: "house",
          price_php: 1_000_000,
          bedrooms: 1,
          bathrooms: 1,
          floor_area_sqm: 40,
          neighborhood: "Probe",
          city: "Makati",
          province: "Metro Manila",
          address: "1 Probe Street",
          amenities: [],
        })
        .select("id, status")
        .single();
      assert(!inserted.error, inserted.error?.message ?? "insert");
      assert(inserted.data?.status === "draft", "Probe did not start as draft");
      probeId = inserted.data.id;
    });

    await check("an agent cannot set featured", async () => {
      assert(probeId, "Probe was not created");
      const updated = await agentA.from("properties").update({ featured: true }).eq("id", probeId);
      assert(updated.error, "Featured update succeeded");
      const fresh = await service.from("properties").select("featured").eq("id", probeId).single();
      assert(fresh.data?.featured === false, "Featured flag changed");
    });

    await check("draft to sold is rejected for the agent and the admin", async () => {
      assert(probeId, "Probe was not created");
      const asAgent = await agentA.from("properties").update({ status: "sold" }).eq("id", probeId);
      const asAdmin = await admin.from("properties").update({ status: "sold" }).eq("id", probeId);
      assert(asAgent.error, "Agent moved draft to sold");
      assert(asAdmin.error, "Admin moved draft to sold");
      const fresh = await service.from("properties").select("status").eq("id", probeId).single();
      assert(fresh.data?.status === "draft", "Status changed");
    });

    await check("an agent cannot publish their own pending listing", async () => {
      assert(probeId, "Probe was not created");
      const pending = await agentA
        .from("properties")
        .update({ status: "pending" })
        .eq("id", probeId)
        .select("status")
        .single();
      assert(!pending.error && pending.data?.status === "pending", pending.error?.message ?? "pending");
      const published = await agentA
        .from("properties")
        .update({ status: "published" })
        .eq("id", probeId);
      assert(published.error, "Agent published a pending listing");
    });

    await check("an admin can publish that pending listing", async () => {
      assert(probeId, "Probe was not created");
      const published = await admin
        .from("properties")
        .update({ status: "published" })
        .eq("id", probeId)
        .select("status, published_at")
        .single();
      assert(!published.error, published.error?.message ?? "publish");
      assert(published.data?.status === "published", "Status did not become published");
      assert(published.data?.published_at, "published_at was not set");
    });

    await check("an anon inquiry on a published listing succeeds", async () => {
      const property = await service
        .from("properties")
        .select("id")
        .eq("slug", "forbes-park-acacia-house")
        .single();
      assert(property.data, "Published listing missing");
      const inserted = await guest.from("inquiries").insert({
        property_id: property.data.id,
        buyer_id: null,
        name: "RLS Guest",
        email: "rls-guest@example.com",
        message: "This anonymous inquiry should land on a published listing only.",
      });
      assert(!inserted.error, inserted.error?.message ?? "insert");
    });

    await check("an anon inquiry on a draft fails", async () => {
      const property = await service
        .from("properties")
        .select("id")
        .eq("slug", "tagaytay-highlands-villa")
        .single();
      assert(property.data, "Draft listing missing");
      const inserted = await guest.from("inquiries").insert({
        property_id: property.data.id,
        buyer_id: null,
        name: "RLS Guest",
        email: "rls-draft@example.com",
        message: "This anonymous inquiry should be rejected because the listing is a draft.",
      });
      assert(inserted.error, "Draft inquiry succeeded");
    });

    await check("favorites are private to their owner", async () => {
      const property = await service
        .from("properties")
        .select("id")
        .eq("slug", "rockwell-proscenium-residence")
        .single();
      assert(property.data, "Rockwell listing missing");
      await service.from("favorites").delete().eq("user_id", buyerId).eq("property_id", property.data.id);
      const inserted = await buyer.from("favorites").insert({
        user_id: buyerId,
        property_id: property.data.id,
      });
      assert(!inserted.error, inserted.error?.message ?? "favorite");
      const mine = await buyer.from("favorites").select("property_id");
      const theirs = await otherBuyer.from("favorites").select("property_id");
      const anon = await guest.from("favorites").select("property_id");
      assert((mine.data ?? []).some((row) => row.property_id === property.data?.id), "Owner cannot see it");
      assert(
        (theirs.data ?? []).every((row) => row.property_id !== property.data?.id),
        "Another buyer can see the favorite",
      );
      assert((anon.data ?? []).length === 0, "Guest can read favorites");
    });

    await check("storage upload into another uid folder is denied", async () => {
      const uploaded = await agentA.storage
        .from("property-images")
        .upload(`${otherBuyerId}/rls-probe.png`, PNG, { contentType: "image/png", upsert: true });
      assert(uploaded.error, "Upload into another folder succeeded");
    });

    await check("storage upload into the agent's own folder succeeds", async () => {
      const uploaded = await agentA.storage
        .from("property-images")
        .upload(`${agentAId}/rls-probe.png`, PNG, { contentType: "image/png", upsert: true });
      assert(!uploaded.error, uploaded.error?.message ?? "upload");
    });

    await check("the inquiry throttle trips on the sixth send", async () => {
      const property = await service
        .from("properties")
        .select("id")
        .eq("slug", "salcedo-village-pavilion")
        .single();
      assert(property.data, "Salcedo listing missing");
      let failures = 0;
      for (let index = 0; index < 6; index += 1) {
        const inserted = await guest.from("inquiries").insert({
          property_id: property.data.id,
          buyer_id: null,
          name: "RLS Throttle",
          email: "rls-throttle@example.com",
          message: `Throttle probe message number ${index + 1} for the hourly limit.`,
        });
        if (inserted.error) failures += 1;
      }
      const stored = await service
        .from("inquiries")
        .select("id", { count: "exact", head: true })
        .eq("email", "rls-throttle@example.com");
      assert(failures === 1, `Expected one rejection, saw ${failures}`);
      assert(stored.count === 5, `Expected 5 stored inquiries, saw ${stored.count}`);
    });

    await check("a buyer cannot list the admin directory", async () => {
      const { data, error } = await buyer.rpc("admin_list_users");
      assert(!error, error?.message ?? "rpc");
      assert((data ?? []).length === 0, "Buyer received the directory");
      const admins = await admin.rpc("admin_list_users");
      assert(!admins.error && (admins.data ?? []).length >= 9, "Admin directory is short");
    });
  } finally {
    await service.from("inquiries").delete().like("email", "rls-%");
    await service.from("favorites").delete().eq("user_id", buyerId).eq(
      "property_id",
      (
        await service.from("properties").select("id").eq("slug", "rockwell-proscenium-residence").maybeSingle()
      ).data?.id ?? "00000000-0000-0000-0000-000000000000",
    );
    await service.from("properties").delete().like("slug", "rls-%");
    await service.storage
      .from("property-images")
      .remove([`${agentAId}/rls-probe.png`, `${otherBuyerId}/rls-probe.png`]);
  }

  const width = Math.max(...results.map((result) => result.name.length));
  for (const result of results) {
    console.log(`${result.pass ? "PASS" : "FAIL"}  ${result.name.padEnd(width)}`);
    if (result.detail) console.log(`      ${result.detail}`);
  }
  const failed = results.filter((result) => !result.pass).length;
  console.log(`${results.length - failed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
