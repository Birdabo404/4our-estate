# 4OUR Estate

A luxury real estate platform for Philippine homes, from Forbes Park estates to Siargao villas. Guests browse a photography-first catalogue. Buyers save homes and send inquiries. Agents list and manage residences. Admins moderate listings and manage people.

Built for the ITE 18 midterm (frontend and backend tracks).

| Layer | Stack |
| --- | --- |
| Web | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Framer Motion, GSAP + ScrollTrigger, Anime.js v4 |
| API | NestJS 12, TypeScript, Prisma 7, PostgreSQL 16, JWT (passport-jwt), bcrypt, class-validator |
| Tooling | Docker Compose for Postgres, Vitest + supertest for API e2e, Playwright for browser e2e |

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

### Environment variables

Web (`.env.local`):

| Variable | Example | Purpose |
| --- | --- | --- |
| `API_URL` | `http://localhost:4000/api/v1` | Base URL the Next server uses to call the API. Never sent to the browser. |

API (`api/.env`):

| Variable | Example | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://estate:estate@localhost:5432/estate` | Postgres connection. |
| `JWT_SECRET` | 32+ random characters | Signs access tokens. The API refuses to boot if it is missing or short. |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime. |
| `PORT` | `4000` | API port. |
| `CORS_ORIGIN` | `http://localhost:3000` | The only browser origin the API accepts. |
| `PUBLIC_API_ORIGIN` | `http://localhost:4000` | Origin written into uploaded image URLs. |

The API validates its environment at boot and exits with a clear message when a value is missing.

### Demo accounts

Every account uses the password `Estate!2026`.

| Role | Email |
| --- | --- |
| Admin | `admin@4our.estate` |
| Agent | `isabel.santos@4our.estate`, `mateo.cruz@4our.estate`, `ana.reyes@4our.estate`, `rafael.delacruz@4our.estate`, `sofia.navarro@4our.estate` |
| Buyer | `camille.uy@4our.estate`, `joaquin.tan@4our.estate`, `bea.lim@4our.estate` |

The login page also lists these in a collapsible "Exploring? Use a demo account" note.

### Checks

```bash
npx tsc --noEmit && npm run lint && npm run build   # web
npm run api:test                                    # API e2e against a separate estate_test database
npm run e2e:public                                  # browser: home, listings, detail, inquiry, favorites
npm run e2e:app                                     # browser: signup, every role's dashboard, list, moderate, publish
```

The browser scripts need both servers running.

## Design philosophy

The full system is in [DESIGN.md](DESIGN.md), and `/styleguide` renders every component live.

- **Editorial luxury.** The site should read like a printed portfolio from a private brokerage, not a listings portal. Photography carries the page. Paper, ink and one Narra brass accent set the stage.
- **Type.** Bodoni Moda for display and Jost for text. A Didone over a Futura revival is the classic fashion-masthead pairing. Bodoni's optical-size axis follows the type scale so small titles stay sturdy.
- **Colour.** Warm paper `#f4efe7`, espresso ink `#1c1915`, and brass `#82613b`. Every text pairing is checked against WCAG by `scripts/design/check-tokens.ts`.
- **Layout.** Generous whitespace, asymmetric editorial grids, a split panel on the property page (gallery left, sticky price and inquiry right), and a quiet sticky nav that turns white over photographs.
- **Motion.** Everything decelerates into place on shared curves from `src/lib/motion.ts`, and nothing bounces. Each library has one job, and ESLint enforces the split:

| Library | Owns |
| --- | --- |
| Framer Motion | Component state and gesture: hover, press, menus, dialogs, lightbox, form error reveals, toasts |
| GSAP + ScrollTrigger | Scroll choreography: hero parallax, image reveals, the pinned "Explore by place" rail |
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
| Create and edit listings, upload photos | no | no | own listings | any listing |
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

- Passwords are hashed with bcrypt (cost 12). Login gives the same message for an unknown email and a wrong password.
- Login and signup return a signed JWT (`{ sub, role }`, 7 days). The Next server stores it in an httpOnly, SameSite=Lax cookie (`estate_session`), so page scripts cannot read it. It sends the token as a Bearer header on every API call.
- `JwtStrategy` reloads the user on each request and ignores the role inside the token. A role change or a deleted account takes effect immediately.
- `src/proxy.ts` sends visitors without a valid, unexpired session to `/login?next=…` before any dashboard renders. Each dashboard page also calls `requireRole(...)`, and the API checks the role again. A UI check alone is never trusted.

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

The seed loads 24 listings across Makati, BGC, Alabang, Tagaytay, Nuvali, Cebu, Mactan, Siargao, Boracay, El Nido, La Union and Baguio at 2026 PHP prices, plus 9 accounts, favorites and inquiries. It is idempotent, so running it twice changes nothing.

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
| `/` | Editorial home: cinematic hero, featured collection, pinned "Explore by place", market figures, agent invitation |
| `/properties` | Search and filters (keyword, sale/rent, type, city, price, beds, sort), pagination, empty and loading states |
| `/properties/[slug]` | Split-panel detail: gallery and lightbox, sticky price and inquiry panel, PH mortgage estimator, similar homes |
| `/login`, `/signup` | Editorial split with photography. Signup chooses Buyer or Agent |
| `/dashboard/buyer` | Saved residences, my inquiries, profile |
| `/dashboard/agent` | Overview, listings with status moves, listing editor with photo upload, inquiry inbox |
| `/dashboard/admin` | Overview, moderation queue, people and roles |
| `/styleguide` | The living design system |

**State management.**
- Favorites are a context provider holding a confirmed set in a reducer, with a `useOptimistic` layer on top. A toggle updates instantly and rolls back with a toast if the save fails.
- Listing filters live in the URL, so back, share and refresh all work.
- The mortgage estimator and the lightbox are local state machines.

**Forms.** The inquiry, signup, login and listing editor forms validate on blur and submit with zod. They show server errors on the matching field, move focus to the first invalid field, and announce form errors through an `aria-live` region.

**Accessibility.** Semantic landmarks, one `h1` per page, a skip link, labelled controls, visible brass focus rings, keyboard-operable menu, gallery, dialogs and filters, and checked colour contrast.

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
│       ├── api/            server-only API client
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

Photos come from Unsplash under the Unsplash License, curated by hand into `src/lib/photography/catalog.ts`. Each one carries its photographer's name, and `scripts/photos/verify.ts` checks every URL still resolves.
