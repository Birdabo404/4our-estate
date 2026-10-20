# 4OUR Estate resume note

Read this first if you are picking the build up in a fresh session or cloud agent.

## Intent

Build 4OUR Estate, a fullstack luxury real estate platform for an ITE 18 midterm (frontend and backend tracks). It must look like Sotheby's International Realty or Compass, not a template. Use Philippine data (PHP prices, Makati, BGC, Alabang, Tagaytay, Cebu, Siargao, Boracay, and so on).

Reference for feature scope only, not visuals: https://github.com/AHMAD-JX/Hozn-RealEstate-Fullstack (listings, buy and sell, auth, profile, admin dashboard).

## Original brief, condensed

- **Design.** Follow the `high-end-visual-design` skill (soft, calm, polished, generous whitespace, soft contrast, spring motion) through an editorial-luxury lens. Photography first, quiet confidence. Forbidden: Inter, purple or blue gradients, generic rounded cards, cookie-cutter heroes, cheap shadows, crowded dashboards. Elegant serif headings with a refined sans body. Restrained palette with at most one accent. Subtle Framer Motion springs. Editorial grids, split panels on listing detail, cinematic images, quiet sticky nav. Desktop and mobile are both first class.
- **Stack.** Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, Supabase (Auth, Postgres, Storage, RLS).
- **Roles.** Guest, Buyer, Agent, Admin, enforced with Supabase Auth and RLS.
- **Screens.** Home, Listings (search and filters), Property detail, Login and signup, role dashboards.
- **Midterm checklist.** Reusable components, clear routing, state management in at least one core feature, responsive, one form with validation and error handling, listings read from Supabase.
- **Backend docs in the README.** Roles and permissions, auth strategy, schema, data access with sample request and response, security practices.
- **Agents.** Design System, then Frontend and Backend, then a dedicated Polish pass. Document design philosophy, roles, and tech choices in the README.

## Done so far (commit `85b57ff` on `main`)

- Next.js 16.4.2 scaffold with Tailwind v4, the `src/` layout, and the `@/*` alias.
- Dependencies are installed and frozen: `@supabase/supabase-js`, `@supabase/ssr`, `framer-motion`, `zod` v4, `@phosphor-icons/react` (use the light weight), `clsx`, `tailwind-merge`, plus dev `@playwright/test`, `tsx`, and the `supabase` CLI.
- `src/lib/domain/types.ts` is the shared contract. It defines roles, `Viewer`, listing and property types, `PropertySummary` and `PropertyDetail`, `Inquiry`, `ListingFilters`, and the `LISTING_TRANSITIONS` state machine (draft, pending, published, sold, archived, with the roles allowed per move). Agents own the listing rows, and admins publish.
- `supabase/` is initialized with `project_id = "4our-estate"`.
- `next.config.ts` turns off `cacheComponents` and `partialPrefetching`, because request-time cookie reads are simpler for this app. It allows remote images from `images.unsplash.com`, `*.supabase.co`, and `127.0.0.1:54321`.
- `.env.example` lists `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.

Nothing else is built yet. The tree is clean and typechecks after `npx next typegen`.

## Decisions and gotchas

- **Do not use the Supabase project behind the local Supabase MCP** (`ydbrsahgpwcxjrhhfakh`). It is an unrelated live product with real users. Its `auth.users` and triggers would capture 4OUR signups. Use a local stack (`npx supabase start`, which needs Docker) or a new dedicated hosted project.
- This Next.js version breaks APIs from older training data. Read `node_modules/next/dist/docs/` before writing code. Middleware is now `proxy.ts` (see `01-app/01-getting-started/16-proxy.md`).
- `@hookform/resolvers` v6 has a broken peer tree, and `react-hook-form` was dropped with it. Forms use one zod schema per form. It validates on the client for inline errors and again in the server action at the boundary, using React `useActionState`. Actions return a discriminated result: `{ ok: true }` or `{ ok: false, fieldErrors, formError }`.
- `high-end-visual-design` versus the brief. The brief wins where they conflict. Apply the skill's whitespace, spring curves, button-in-button CTAs, eyebrow tags, grain overlay, and mobile collapse. Keep photography unboxed and radii restrained. The double-bezel treatment fits UI panels (filters, forms, dashboards), not photos.

## Planned route and ownership map

```
src/app/layout.tsx                   root: fonts, grain, providers            (design)
src/app/(site)/layout.tsx            nav + footer, nav takes viewer: Viewer   (design)
src/app/(site)/page.tsx              home                                     (frontend-public)
src/app/(site)/properties/...        listings + [slug] detail                 (frontend-public)
src/app/(auth)/login, signup         split panel with photography             (frontend-app)
src/app/dashboard/{buyer,agent,admin}                                         (frontend-app)
src/app/styleguide                   living design system page                (design)
src/components/ui/*, site/*, property/property-card.tsx, src/lib/{cn,format,motion}.ts   (design)
supabase/migrations/*, scripts/seed.ts, scripts/verify-rls.ts               (backend)
src/lib/supabase/*, src/proxy.ts, src/lib/data/*, src/lib/actions/*, src/lib/validation/*  (backend)
```

`PropertyCard` takes a `PropertySummary` and an optional favorite slot (a ReactNode), which keeps favorites logic out of the design system.

## Backend plan

- Tables: `profiles` (role, agency, license_no, phone, bio, avatar_url), `properties` (slug, listing_type, property_type, status, price_php, beds, baths, floor and lot sqm, parking, neighborhood, city, province, address, lat and lng, amenities text[], year_built, featured, published_at, plus a search tsvector), `property_images`, `favorites`, `inquiries`.
- A trigger on signup creates the profile with a role from metadata, restricted to buyer or agent. Only admins can change roles. A trigger enforces `LISTING_TRANSITIONS`. RLS rules: guests read only published rows, agents write their own listings, admins can do everything, buyers manage their own favorites and inquiries, and agents read inquiries on their own listings. Storage bucket `property-images` is publicly readable, and agents write under `{uid}/`.
- `scripts/seed.ts` is idempotent and uses the service role. It seeds 1 admin, 5 agents, 2 buyers with documented demo passwords, about 24 PH properties, and 4 to 6 verified Unsplash images each (check every URL with curl). It also seeds sample inquiries and favorites.
- `scripts/verify-rls.ts` asserts the role matrix and must pass.

## Done predicate

- `npm run build`, `tsc --noEmit`, and `npm run lint` pass.
- `verify-rls` passes against a real Supabase instance.
- A Playwright smoke test renders every route at 1440 and 390 px widths with seeded data and no console errors. Signup, each role dashboard, and inquiry form validation all work.
- Screenshots are reviewed before the PR.

## Next steps

1. Get Supabase running: local Docker in the VM, or a new hosted project with keys in env. Write `.env.local`.
2. Run the Design System and Backend workstreams in parallel on separate branches, using the ownership map above.
3. Merge them, then wire `getViewer()` into `(site)/layout.tsx`.
4. Run Frontend-public and Frontend-app in parallel, then merge.
5. Do the Polish pass, run Playwright verification, write the README (design philosophy, roles, schema, auth, data access samples, security), and open the PR.
