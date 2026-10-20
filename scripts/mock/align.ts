import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

import type { Store } from "../../src/lib/api/mock/types";

type QueryClient = {
  connect(): Promise<void>;
  end(): Promise<void>;
  query(sql: string): Promise<{ rows: Record<string, unknown>[] }>;
};

function databaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const text = readFileSync(new URL("../../api/.env", import.meta.url), "utf8");
  for (const line of text.split("\n")) {
    if (!line.startsWith("DATABASE_URL=")) continue;
    return line.slice("DATABASE_URL=".length).trim();
  }
  throw new Error("DATABASE_URL is missing. Parity reads clocks from Postgres and does not print the URL.");
}

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return new Date(value).toISOString();
  throw new Error("Postgres returned a clock that was not a date.");
}

// Seed data has no createdAt. Postgres fills that column with now() at insert.
// The live database can also hold favorites saved by test runs after the seed. Those are reported and
// removed from the live side of the compare, never added to the mock, so a seed favorite the mock lost still fails.
export type Alignment = { notes: string[]; extraFavorites: Map<string, Set<string>> };

export async function alignStore(store: Store): Promise<Alignment> {
  const require = createRequire(new URL("../../api/package.json", import.meta.url));
  const pg = require("pg") as { Client: new (config: { connectionString: string }) => QueryClient };
  const client = new pg.Client({ connectionString: databaseUrl() });
  try {
    await client.connect();
  } catch {
    throw new Error("Could not read clocks from Postgres.");
  }
  const notes: string[] = [];
  const extraFavorites = new Map<string, Set<string>>();
  try {
    const users = await client.query(`select email, "createdAt" from users`);
    for (const row of users.rows) {
      const email = String(row.email);
      const user = store.users.find((item) => item.email === email);
      if (!user) continue;
      user.createdAt = iso(row.createdAt);
    }
    notes.push(`aligned createdAt for ${users.rows.length} users from Postgres`);

    const properties = await client.query(`select slug, "createdAt", "updatedAt" from properties`);
    for (const row of properties.rows) {
      const property = store.properties.find((item) => item.slug === String(row.slug));
      if (!property) continue;
      property.createdAt = iso(row.createdAt);
      property.updatedAt = iso(row.updatedAt);
    }
    notes.push(`aligned createdAt and updatedAt for ${properties.rows.length} listings from Postgres`);

    const inquiries = await client.query(`select id, "createdAt" from inquiries`);
    for (const row of inquiries.rows) {
      const inquiry = store.inquiries.find((item) => item.id === String(row.id));
      if (!inquiry) continue;
      inquiry.createdAt = iso(row.createdAt);
    }
    notes.push(`aligned createdAt for ${inquiries.rows.length} inquiries from Postgres`);

    const favorites = await client.query(
      `select u.email as email, p.slug as slug, f."createdAt" as "createdAt" from favorites f join users u on u.id = f."userId" join properties p on p.id = f."propertyId"`,
    );
    let extras = 0;
    for (const row of favorites.rows) {
      const email = String(row.email);
      const slug = String(row.slug);
      const user = store.users.find((item) => item.email === email);
      const property = store.properties.find((item) => item.slug === slug);
      if (!user || !property) continue;
      const createdAt = iso(row.createdAt);
      const existing = store.favorites.find((item) => item.userId === user.id && item.propertyId === property.id);
      if (existing) {
        existing.createdAt = createdAt;
        continue;
      }
      const forUser = extraFavorites.get(user.id) ?? new Set<string>();
      forUser.add(property.id);
      extraFavorites.set(user.id, forUser);
      extras += 1;
      notes.push(`favorite not in seed data, excluded from the live side: ${email} saved ${slug}`);
    }
    notes.push(`excluded ${extras} live favorites that are not in the seed`);
    return { notes, extraFavorites };
  } finally {
    await client.end();
  }
}
