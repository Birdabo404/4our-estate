# 4OUR Estate

A real estate platform for Philippine homes, from Forbes Park estates to Siargao villas. Guests search and browse a photo-led catalogue with real numbers up front. Buyers save homes and send inquiries. Agents list and manage residences. Admins moderate listings and manage people.

Built for the ITE 18 midterm (frontend and backend tracks).

| Layer | Stack |
| --- | --- |
| Web | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Redux Toolkit, Framer Motion, GSAP + ScrollTrigger, Anime.js v4 |
| API | NestJS 12, TypeScript, Prisma 7, PostgreSQL 16, JWT (passport-jwt), bcrypt, class-validator, Swagger (OpenAPI 3) |
| Tooling | Docker Compose for Postgres, Vitest + supertest for API e2e, Playwright for browser e2e |
| Hosting | Vercel (web), Render (API + Postgres) |

## Run it locally

You need Node 22+ and Docker.

```bash
# 1. Install both packages
npm install
npm --prefix api install

# 2. Environment
cp .env.example .env.local
cp api/.env.example api/.env

# 3. Database: start Postgres, apply migrations, seed demo data
npm run db:up
npm run db:migrate
npm run db:seed

# 4. Run the API (http://localhost:4000/api/v1) and the web app (http://localhost:3000)
npm run api:dev     # terminal 1
npm run dev         # terminal 2
```

Interactive API docs (Swagger UI) are at http://localhost:4000/api/docs, and the raw OpenAPI spec is at `/api/docs-json`. Log in with `POST /auth/login`, then paste the `accessToken` into **Authorize** to call protected routes.

### Mock-data mode (no API, no database)

```bash
npm install
DATA_MODE=mock npm run dev
```

The web app answers every request from an in-memory copy of the seed data instead of calling the API. All screens, logins, favorites, inquiries, listing edits and moderation work. Two limits apply. Changes last only until the server restarts, and photo uploads need the live API. The mock is built from the API's own seed files with the same ids. `npx tsx scripts/mock/parity.ts` compares its responses with a running API and fails on any difference.

### Environment variables

Web (`.env.local`):

| Variable | Example | Purpose |
| --- | --- | --- |
| `API_URL` | `http://localhost:4000/api/v1` | Base URL the Next server uses to call the API. Never sent to the browser. A non-localhost host is also allowed as an image source for uploaded photos. |
| `DATA_MODE` | unset or `mock` | `mock` serves the seed data from memory and never calls the API. |

API (`api/.env`):

| Variable | Example | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://estate:estate@localhost:5432/estate` | Postgres connection. |
| `JWT_SECRET` | a long random string | Signs access tokens. The API refuses to boot if it is missing or shorter than 16 characters. Use 32 or more in any shared environment. |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime. |
| `PORT` | `4000` | API port. |
| `CORS_ORIGIN` | `http://localhost:3000` | The only browser origin the API accepts. |
| `PUBLIC_API_ORIGIN` | `http://localhost:4000` | Origin written into uploaded image URLs. |
| `SWAGGER_ENABLED` | `true` | Set to `false` to stop serving `/api/docs`. |

The API validates its environment at boot and exits with a clear message when a value is missing.

### Demo accounts

Every account uses the password `Estate!2026`.

| Role | Email |
| --- | --- |
| Admin | `admin@4our.estate` |
| Agent | `isabel.santos@4our.estate`, `mateo.cruz@4our.estate`, `ana.reyes@4our.estate`, `rafael.delacruz@4our.estate`, `sofia.navarro@4our.estate` |
| Buyer | `camille.uy@4our.estate`, `joaquin.tan@4our.estate`, `bea.lim@4our.estate`, `clyde.lontoc@4our.estate` |

The login page also lists these in a collapsible "Exploring? Use a demo account" note.

### Checks

```bash
npx tsc --noEmit && npm run lint && npm run build   # web
npm run api:test                                    # API e2e against a separate estate_test database
npm run e2e:public                                  # browser: home, listings, detail, inquiry, favorites
npm run e2e:app                                     # browser: signup, every role's dashboard, list, moderate, publish
npx tsx scripts/store/favorites.check.ts            # Redux favorites slice
npx tsx scripts/mock/parity.ts                      # mock responses equal the live API's
```

The browser scripts need both servers running.

## Design philosophy

The full system is in [DESIGN.md](DESIGN.md), and `/styleguide` renders every component live.

- **Workbench, not brochure.** The site should feel like a tool a sharp developer built for home hunters: honest numbers, clear labels and a little play in the margins. Photography sells the house, and the interface around it stays direct and readable.
- **Type.** Bricolage Grotesque for display, Hanken Grotesk for text and JetBrains Mono for labels and data. Bricolage's width axis gives condensed figures for stats and spec sheets. Emphasis is an orange highlighter stroke, not italics.
- **Colour.** Paper `#f4f2ec` and ink `#151411`, with Kahel orange `#ff5a1f` for the one thing to press sky `#cfe9f1` as the calm field behind heroes and page headers, and a Manila Bay cobalt `#1d44c8` for the footer. Orange fills always carry ink labels. Every text pairing is checked against WCAG by `scripts/design/check-tokens.ts`.
- **Texture.** Dithered place photos (an 8×8 Bayer canvas that wipes away on hover), an ASCII floor plan, blueprint grids and a rotating stamp. All of it is decorative and hidden from assistive tech.
- **Layout.** A sticky night search bar on listings, white cards with a spec sheet, a sky header and photo mosaic on the property page, and real dashboards with stat cards, bar charts and tables.
- **Motion.** Short and purposeful, on shared curves from `src/lib/motion.ts`, and nothing bounces. Each library has one job, and ESLint enforces the split:

| Library | Owns |
| --- | --- |
| Framer Motion | Component state and gesture: hover, press, menus, dialogs, lightbox, form error reveals, toasts |
| GSAP + ScrollTrigger | Scroll-linked reveals: gallery rows on the property page, clip-path image reveals |
| Anime.js | SVG and type: the 4OUR wordmark stroke draw, headline word staggers, count-ups |

All motion respects `prefers-reduced-motion`.

## Roles and permissions

Guest is anyone without a token. Buyer, Agent and Admin are stored on the user and enforced by NestJS guards on every request.

| Action | Guest | Buyer | Agent | Admin |
| --- | --- | --- | --- | --- |
| Browse and search published listings | yes | yes | yes | yes |
| Open a sold listing by link | yes | yes | yes | yes |
| Send an inquiry | yes | yes | yes | yes |
| Save favorites | no | yes | yes | yes |
| Create and edit listings, upload photos | no | no | own listings | any listing (the admin desk reaches them through moderation) |
| Submit a draft for review, mark sold, archive | no | no | own listings | yes |
| Publish a pending listing | no | no | no | yes |
| Feature a listing | no | no | no | yes |
| Read inquiries | no | own | on own listings | on own listings |
| Change a user's role | no | no | no | yes, never the last admin |

A listing moves through `draft → pending → published → sold → archived`. The allowed moves and the roles that may make them are one table (`LISTING_TRANSITIONS`). The web app reads it to decide which buttons to show. The API reads an identical copy to enforce it, and an API test fails if the two drift.

The full matrix is in [docs/api.md](docs/api.md#roles).

## Backend design

### Architecture

```text
Browser ──► Next.js server (pages, server actions)
               │  src/lib/data/*     typed reads
               │  src/lib/actions/*  validated writes
               ▼
            fetch + Authorization: Bearer <JWT>
               ▼
NestJS API ── guards ─ pipes ─ controllers ─ services ─ Prisma ─► PostgreSQL
```

The browser never talks to the API for data. Pages and server actions call it from the Next server. UI components only import `src/lib/data/*` and `src/lib/actions/*`, which return the domain types in `src/lib/domain/types.ts`. That seam is why the backend could be swapped without rewriting a screen.

The API is one NestJS module per resource:

| Module | Responsibility |
| --- | --- |
| `AuthModule` | Signup, login, `JwtStrategy`, `JwtAuthGuard`, `OptionalJwtAuthGuard`, `RolesGuard`, `@Roles()`, `@Public()`, `@CurrentUser()` |
| `PropertiesModule` | Catalogue search, detail, editor CRUD, status transitions, image upload and ordering |
| `FavoritesModule` | Saved residences per member |
| `InquiriesModule` | Inquiries, per-email throttle, agent inbox, status updates |
| `ProfileModule` | Own profile read and update |
| `AdminModule` | Stats, moderation queue, user directory, role changes |
| `PrismaModule`, `HealthModule` | Database client, health check |

A request passes helmet and CORS, then the global `JwtAuthGuard` (routes are protected unless marked `@Public()`). `RolesGuard` runs next, then the global `ValidationPipe` validates the DTO. The controller calls a service. The interceptor wraps the result, and the exception filter shapes any error.

### Authentication

- Passwords are hashed with bcrypt (cost 12). Login gives the same message, and takes the same bcrypt work, for an unknown email and a wrong password.
- Login and signup return a signed JWT (`{ sub, role }`, 7 days). The Next server stores it in an httpOnly, SameSite=Lax cookie (`estate_session`), so page scripts cannot read it. It sends the token as a Bearer header on every API call.
- `JwtStrategy` reloads the user on each request and ignores the role inside the token. A role change or a deleted account takes effect immediately.
- `src/proxy.ts` sends visitors without an unexpired session cookie to `/login?next=…` before any dashboard renders. It only reads the token's expiry. It does not verify the signature, so it is a fast redirect, not a security check. Each dashboard page then calls `requireRole(...)`, which asks the API who the token belongs to, and the API verifies the signature and checks the role on every request.

### Database schema

Prisma schema: [api/prisma/schema.prisma](api/prisma/schema.prisma). Migrations are committed under `api/prisma/migrations`.

```mermaid
erDiagram
  users ||--o{ properties : "lists (agentId)"
  users ||--o{ favorites : saves
  users |o--o{ inquiries : "sends (buyerId, optional)"
  properties ||--o{ property_images : has
  properties ||--o{ favorites : "saved in"
  properties ||--o{ inquiries : receives
```

| Table | Key columns |
| --- | --- |
| `users` | `email` (unique), `passwordHash`, `role` (buyer, agent, admin), `fullName`, `phone`, `agency`, `licenseNo`, `bio` |
| `properties` | `slug` (unique), `agentId`, `listingType` (sale, rent), `propertyType`, `status`, `pricePhp`, beds, baths, floor and lot sqm, `neighborhood`, `city`, `province`, coordinates, `amenities[]`, `featured`, `publishedAt` |
| `property_images` | `propertyId`, `url`, `storagePath` (uploaded files), `alt`, `position` (0 is the cover) |
| `favorites` | (`userId`, `propertyId`) primary key |
| `inquiries` | `propertyId`, `buyerId` (null for guests), `name`, `email`, `phone`, `message`, `preferredViewingDate`, `status` (new, contacted, closed) |

The seed loads 24 listings across Makati, BGC, Alabang, Tagaytay, Nuvali, Cebu, Mactan, Siargao, Boracay, El Nido, La Union and Baguio at 2026 PHP prices, plus 10 accounts, favorites and inquiries. It is idempotent, so running it twice changes nothing.

### Data access and sample requests

Every success is `{ "data": T }`, and lists add `"meta": { "total", "page", "pageSize" }`. Every error is `{ "error": { "statusCode", "code", "message", "fields"? } }`.

Search published listings:

```http
GET /api/v1/properties?city=General%20Luna&listingType=sale&sort=price_desc&page=1
```

```json
{
  "data": [
    {
      "slug": "siargao-cloud-nine-villa",
      "title": "Villa off Cloud 9, Siargao",
      "listingType": "sale",
      "propertyType": "villa",
      "pricePhp": 68000000,
      "bedrooms": 4,
      "city": "General Luna",
      "province": "Surigao del Norte",
      "coverImage": { "url": "https://images.unsplash.com/…", "alt": "…", "position": 0 }
    }
  ],
  "meta": { "total": 1, "page": 1, "pageSize": 12 }
}
```

Log in:

```http
POST /api/v1/auth/login
{ "email": "admin@4our.estate", "password": "Estate!2026" }
```

```json
{ "data": { "accessToken": "eyJhbGciOi…", "user": { "kind": "member", "role": "admin", "fullName": "Elena Marquez" } } }
```

Validation failure:

```json
{
  "error": {
    "statusCode": 400,
    "code": "VALIDATION_FAILED",
    "message": "Check the highlighted fields.",
    "fields": { "role": "Choose buyer or agent.", "password": "Use 8 to 72 characters, including a letter and a number." }
  }
}
```

A buyer calling an admin route gets `403 { "error": { "code": "FORBIDDEN", "message": "You do not have permission to do that." } }`.

Every endpoint is listed in [docs/api.md](docs/api.md) with method, role, body and response.

### Security practices

- **Deny by default.** Every API route needs a valid JWT unless it is marked `@Public()`. `RolesGuard` checks the role, and services check ownership, so an agent can only touch their own listings.
- **Rules live on the server.** Listing transitions, admin-only `featured`, last-admin protection and inquiry throttling are enforced in NestJS services, not in the UI.
- **Validation at both edges.** class-validator on every DTO, with whitelisting that rejects unknown fields. The same rules run as zod schemas in the web forms for instant inline errors.
- **Passwords.** bcrypt cost 12, never returned in any response.
- **Tokens.** httpOnly cookie on the web side. Reloaded user on every API request.
- **Throttling.** Login is limited to 10 a minute per IP. Each email may send 5 inquiries an hour, counted in Postgres under an advisory lock so concurrent requests can't slip past.
- **Uploads.** jpeg, png, webp or avif only, at most 8 MB, stored under the uploader's id and served read-only from `/uploads`.
- **Headers and origins.** helmet, CORS locked to the web origin, and a same-site check on every `?next=` redirect.
- **Errors.** One filter maps every failure to the error envelope. Stack traces and SQL never reach the client.

## Frontend

| Route | Screen |
| --- | --- |
| `/` | Home: sky hero with search, live ticker, featured homes, dithered "Explore by place", latest listings ledger, market figures with an ASCII plan, how it works, agent invitation |
| `/properties` | Search and filters (keyword, sale/rent, type, city, price, beds, sort), pagination, empty and loading states |
| `/properties/[slug]` | Sky header and photo mosaic, lightbox, key facts, spec sheet, map card, sticky price and inquiry panel, PH mortgage estimator, similar homes |
| `/login`, `/signup` | Split screen with a dithered photo panel. Signup chooses Buyer or Agent |
| `/dashboard/buyer` | Stat cards, latest inquiries, saved homes, profile |
| `/dashboard/agent` | Overview with stats, pipeline and inquiry charts, attention list and book table; listings with status moves, listing editor with photo upload, inquiry inbox |
| `/dashboard/admin` | Overview with catalogue, member and city charts and the review queue; moderation queue, people and roles |
| `/styleguide` | The living design system |

**State management.**
- Favorites live in a Redux Toolkit store (`src/lib/store/`), with one store per request, created in a client `StoreProvider` mounted in the root layout. The `favorites` slice keeps the server-confirmed ids plus a map of pending intents. A `createAsyncThunk` calls the server action, so a toggle shows instantly, commits on success, and rolls back with a toast on failure. A newer tap is never overwritten by an older request that settles late. Components still use `useFavorites()` and `<FavoriteButton>`.
- Listing filters live in the URL, so back, share and refresh all work.
- The mortgage estimator and the lightbox are local state machines.

**Forms.** The inquiry, signup, login and listing editor forms validate on blur and submit with zod. They show server errors on the matching field, move focus to the first invalid field, and announce form errors through an `aria-live` region.

**Accessibility.** Semantic landmarks, one `h1` per page, a skip link, labelled controls, visible orange focus rings, keyboard-operable menu, gallery, dialogs and filters, and checked colour contrast.

## Project structure

```text
.
├── api/                    NestJS API (own package.json)
│   ├── prisma/             schema, migrations, seed and seed data
│   ├── src/                modules: auth, properties, favorites, inquiries, profile, admin
│   └── test/               e2e suite
├── src/
│   ├── app/                Next routes: (site), (auth), dashboard, styleguide
│   ├── components/         ui, motion, site, property, home, listings, property-detail, auth, dashboard
│   └── lib/
│       ├── domain/         shared types and the listing transition table
│       ├── api/            server-only API client, and mock/ for DATA_MODE=mock
│       ├── store/          Redux Toolkit store and the favorites slice
│       ├── data/           typed reads used by pages
│       ├── actions/        server actions used by forms
│       ├── validation/     zod schemas shared by forms and actions
│       └── photography/    curated, verified photo catalogue
├── scripts/                design checks, photo tooling, browser e2e
├── docs/api.md             full API reference
├── DESIGN.md               design system
└── docker-compose.yml      Postgres
```

## Photography

Photos come from Unsplash under the Unsplash License, curated by hand into `src/lib/photography/catalog.ts`. Each one carries its photographer's name, and `scripts/photos/verify.ts` checks every URL still resolves. The footer credits the contributors and links to `/credits`, which lists every photographer with their photos.

## Deploy

The web app goes to Vercel and the API plus Postgres to Render. For a demo with no backend, deploy only the web app with `DATA_MODE=mock`.

### API and database on Render

`render.yaml` is a Render Blueprint for the web service `4our-estate-api` (root `api/`) and the Postgres database `4our-estate-db`, both on the free plan.

1. In Render, choose **New > Blueprint** and pick this repository.
2. When asked, set `CORS_ORIGIN` to your Vercel URL (for example `https://4our-estate.vercel.app`) and `PUBLIC_API_ORIGIN` to the Render service URL (for example `https://4our-estate-api.onrender.com`).
3. Apply. Render generates `JWT_SECRET` and wires `DATABASE_URL`. Every start runs `prisma migrate deploy` before the server boots. Render health-checks `/api/v1/health`.
4. Seed once from your machine with the database's **external** URL:

```bash
cd api
DATABASE_URL="<external database URL from Render>" npm run db:seed
```

Free-plan limits:
- Uploaded photos live on an ephemeral disk and disappear on redeploy, restart or spin-down.
- The service sleeps after 15 idle minutes, and the first request after that takes about a minute.
- Free Postgres expires after 30 days.

[docs/api.md](docs/api.md#deploy-to-render) has the details.

### Web app on Vercel

1. In Vercel, import this repository. The framework preset is Next.js and the root directory is the repo root. `.vercelignore` keeps the API package out of the upload, except the seed data the mock mode reads.
2. Set the environment variables:
   - **Against the Render API:** `API_URL=https://<your-render-service>.onrender.com/api/v1`.
   - **Without a backend:** `DATA_MODE=mock`.
3. Deploy, then put the Vercel URL into Render's `CORS_ORIGIN` if you didn't already.

When the Render service is asleep, the first page load waits for it to wake. Mock mode has no such delay.

**Live demo:** https://4our-estate.vercel.app runs in mock mode. Browsing, search, detail pages, login with the demo accounts, signup and dashboards all work. Vercel runs several server instances with separate memory, so in mock mode a change made on one instance may be missing on another. That covers a saved favorite, a new listing, an inquiry, or a status change. Accounts survive because the session token carries the member's profile. For changes that persist and are shared, point `API_URL` at the Render API instead of using `DATA_MODE=mock`.

The mock deploy path was checked locally. The committed files minus the `.vercelignore` exclusions installed and built cleanly with `DATA_MODE=mock`. Started with `next start` and the API address pointed at a closed port, the build passed the public browser suite (30/30) and the agent-to-admin publish flow.
