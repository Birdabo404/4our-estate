# API

The 4OUR Estate API is a NestJS service on PostgreSQL. The Next.js app calls it from `src/lib/data` and `src/lib/actions`. This service speaks the same listing, account, inquiry, and favorite shapes as `src/lib/domain/types.ts` and `src/lib/data/types.ts`.

Base URL: `http://localhost:4000/api/v1`.

Every success body is `{ "data": T }`. A paginated list is `{ "data": T[], "meta": { "total", "page", "pageSize" } }`. Every error body is `{ "error": { "statusCode", "code", "message", "fields"? } }`. `fields` uses the DTO property names, one sentence each.

`code` is one of `VALIDATION_FAILED`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `TOO_MANY_REQUESTS`, `BAD_REQUEST`, `INTERNAL`.

Dates are ISO strings. Money is a JSON number of whole Philippine pesos. `publishedAt` uses `Date.toISOString()`, so a seeded instant looks like `2026-01-08T02:00:00.000Z`. A viewing date is `YYYY-MM-DD`.

## Run the API

Postgres publishes port 5432.

```bash
docker compose up -d postgres
cd api
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

`npm run start:dev` generates the Prisma client, then watches `api/src`. The process listens on `0.0.0.0` and `PORT`.

Seed again whenever you want the same 10 accounts and 24 listings. The second run updates rows in place and does not insert duplicates. The demo password is `Estate!2026`.

```bash
cd api
npm run test:e2e
npm run build
npm run lint
npx tsc --noEmit
```

`npm run test:e2e` points `DATABASE_URL` at `estate_test`, applies migrations, truncates, seeds, and runs the HTTP suite. It does not touch the `estate` database.

| Variable | Role |
| --- | --- |
| `DATABASE_URL` | Postgres URL. Dev uses database `estate`. Tests use `estate_test`. |
| `JWT_SECRET` | HMAC secret. At least 16 characters. The process exits if it is missing or short. |
| `JWT_EXPIRES_IN` | Token lifetime. Default `7d`. |
| `PORT` | HTTP port. Default `4000`. |
| `CORS_ORIGIN` | Browser origin allowed to call the API. Default `http://localhost:3000`. |
| `PUBLIC_API_ORIGIN` | Absolute origin written into uploaded image URLs. Default `http://localhost:4000`. No trailing slash. |
| `SWAGGER_ENABLED` | Serves Swagger UI at `/api/docs` and the OpenAPI document at `/api/docs-json` when `true`. Default `true`. Set `false` to leave those routes unmounted. |

## Interactive docs

With the API running, open `http://localhost:4000/api/docs`. The raw document is `http://localhost:4000/api/docs-json`.

The page title is 4OUR Estate API. Operations are grouped by tag. Use **Authorize** with the `accessToken` from `POST /auth/login`. The header is `Authorization: Bearer <token>`.

`npm run build` and `nest start` run the `@nestjs/swagger` CLI plugin. Field lists then come from the DTO classes and the `class-validator` decorators. Vitest does not run that plugin. During `npm run test:e2e`, `/api/docs-json` still lists every route, the bearer scheme, and the login envelope. The field lists are in the document produced by `nest build`.

## Architecture

```text
api/src
  main.ts                     listen, after configureApp
  configure-app.ts            helmet, CORS, prefix, static files, ValidationPipe, Swagger
  openapi/                    response models, envelope decorator, Swagger setup
  app.module.ts               module graph and global guard, filter, interceptor
  config/env.ts               boot-time env schema
  common/                     contracts, envelope, errors, phone, uploads
  prisma/                     PrismaService with the pg adapter
  auth/                       signup, login, JWT, guards, decorators
  properties/                 catalog, editor, transitions, images
  favorites/
  inquiries/
  profile/
  admin/
  health/
```

A request passes helmet and CORS, then the global `JwtAuthGuard`. `@Public()` skips that guard. `RolesGuard` runs next and allows the call when the handler has no `@Roles()`. Method guards run after that. `OptionalJwtAuthGuard` is on the listing page and on `POST /inquiries`. `ThrottlerGuard` is on login and on inquiry create. `ValidationPipe` then checks the DTO. The controller calls a service. The service calls Prisma or a pure helper. `EnvelopeInterceptor` wraps the return value. `AllExceptionsFilter` turns failures into the error envelope and logs the server-side detail.

Business rules that do not need the database live in pure helpers. `listing-transitions.ts` is the status table. `slug.ts`, `median.ts`, and `common/phone.ts` are the same kind of helper. Controllers do not branch on roles beyond the guards.

Prisma 7 keeps the connection string in `api/prisma.config.ts` and requires a driver adapter. `PrismaService` constructs `PrismaPg` from `DATABASE_URL` and passes it to `PrismaClient`. The generated client is `api/src/generated/prisma` and is not committed. `npm run build` and `npm run start:dev` generate it.

Two shapes were considered. One module per HTTP resource makes the Nest pieces easy to find, and the course asks for those pieces by name. A single catalog module would hide listings, images, and favorites behind one service and a smaller import graph. The resource split won because the HTTP routes are already the public boundary, and images stay inside the properties module where the position invariant lives.

## Roles

`buyer`, `agent`, and `admin` are the only roles. Signup accepts `buyer` or `agent`. `admin` on signup is a validation error. An admin changes roles later. The last admin cannot be demoted.

| Action | Guest | Buyer | Agent | Admin |
| --- | --- | --- | --- | --- |
| Read published listings, cities, stats, featured | yes | yes | yes | yes |
| Open a published or sold listing by slug, including photos | yes | yes | yes | yes |
| Open a draft, pending, or archived listing by slug | no | no | own row | any row |
| Create a listing | no | no | own draft | own draft |
| Edit listing copy | no | no | own row | any row |
| Set `featured` | no | no | no | yes |
| Change `agentId` | no | no | no | no endpoint |
| `pending` to `published` | no | no | no | yes |
| `draft` to `sold` | no | no | no | no |
| Read and edit own profile, not `role` | no | yes | yes | yes |
| Change `role` | no | no | no | yes, except the last admin |
| Read and write own favorites | no | yes | yes | yes |
| Favorite a draft, pending, or archived listing | no | no | no | no |
| Send an inquiry on a published listing | yes, `buyerId` null | `buyerId` set | `buyerId` set | `buyerId` set |
| Read own inquiries | no | own rows | no | no |
| Read inquiries on own listings | no | no | yes | own listings only |
| Update inquiry status | no | no | own listings | any listing |
| Upload or delete a listing photo | no | no | own listing | any listing |
| Admin stats, moderation queue, user directory | no | no | no | yes |

Ownership for an agent is `property.agentId === user.id`. A failed ownership check on a write is `403`. A guest or buyer who asks for a private slug gets `404`, including when the row exists.

## Authentication

`POST /auth/signup` and `POST /auth/login` return `{ accessToken, user }`. `user` is a member viewer: `kind`, `id`, `email`, `role`, `fullName`, `avatarUrl`. Passwords are bcrypt hashes with cost 12. The token payload is `{ sub, role }`, signed with `JWT_SECRET` and expired after `JWT_EXPIRES_IN`.

`JwtStrategy` reads the bearer token and loads the user by `sub`. The role on the token is not trusted. A deleted user or a changed role takes effect on the next request. A missing or bad token on a protected route is `401` with message `Sign in to continue.` Login failures, wrong email and wrong password, both return `401` `Email or password is incorrect.`

Login is limited to 10 requests a minute per IP by `@nestjs/throttler`, stored in process memory. That counter resets when the process restarts. The inquiry email cap does not. It counts rows in `inquiries` inside a transaction that takes `pg_advisory_xact_lock` on the lowercased email, and it rejects the sixth insert in a rolling hour with `429`.

## Schema

```mermaid
erDiagram
  users ||--o{ properties : agentId
  users ||--o{ favorites : userId
  users |o--o{ inquiries : buyerId
  properties ||--o{ property_images : propertyId
  properties ||--o{ favorites : propertyId
  properties ||--o{ inquiries : propertyId
  users {
    uuid id
    string email
    string passwordHash
    Role role
    string fullName
  }
  properties {
    uuid id
    string slug
    uuid agentId
    ListingStatus status
    bigint pricePhp
    boolean featured
  }
  property_images {
    uuid id
    string url
    string storagePath
    int position
  }
  favorites {
    uuid userId
    uuid propertyId
  }
  inquiries {
    uuid id
    uuid propertyId
    uuid buyerId
    InquiryStatus status
  }
```

Postgres enums match the TypeScript unions: `Role`, `ListingType`, `PropertyType`, `ListingStatus`, `InquiryStatus`.

`properties` is indexed on `(status, city)`, `pricePhp`, `publishedAt`, and `agentId`. `property_images` is unique on `(propertyId, position)`. The cover is the lowest position. `favorites` uses the composite primary key `(userId, propertyId)`. Deleting a property deletes its images and favorites. An inquiry blocks deletion of its property. Deleting a buyer sets `inquiries.buyerId` to null.

Check constraints mirror the old column limits: slug shape, positive price, lengths, coordinate ranges, and the inquiry email shape. The status machine, the featured flag, the last admin, and the inquiry throttle are enforced in services, not triggers.

Uploaded files are stored at `api/uploads/{userId}/{propertyId}/{uuid}.{ext}` and served at `/uploads/...`, outside the `/api/v1` prefix. Seed images keep their Unsplash URLs and a null `storagePath`.

## Endpoints

| Method | Path | Role | Body | Response `data` |
| --- | --- | --- | --- | --- |
| POST | `/auth/signup` | public | `{ role, fullName, email, password, phone?, agency?, licenseNo? }` | `{ accessToken, user }` `201` |
| POST | `/auth/login` | public | `{ email, password }` | `{ accessToken, user }` `200` |
| GET | `/auth/me` | member | | member viewer |
| GET | `/properties` | public | query `q`, `listingType`, `propertyType`, `city`, `minPrice`, `maxPrice`, `minBeds`, `sort`, `page` | `PropertySummary[]` plus `meta`, page size 12 |
| GET | `/properties/featured` | public | query `limit`, default 4 | `PropertySummary[]` |
| GET | `/properties/cities` | public | | `CityCount[]` |
| GET | `/properties/stats` | public | | `MarketStats` |
| GET | `/properties/id/:id` | agent or admin | | `PropertyDetail` |
| GET | `/properties/:slug` | public, optional JWT | | `PropertyDetail` |
| GET | `/properties/:slug/similar` | public | query `limit`, default 3 | `PropertySummary[]` |
| POST | `/properties` | agent or admin | listing content | `{ id, slug }` `201` |
| PATCH | `/properties/:id` | owner or admin | listing content, no status | `{ id, slug }` |
| POST | `/properties/:id/transitions` | owner or admin | `{ to }` | `{ id, status, slug }` |
| PATCH | `/properties/:id/featured` | admin | `{ featured }` | `{ id, featured }` |
| POST | `/properties/:id/images` | owner or admin | multipart `file`, field `alt` | `PropertyImage` `201` |
| DELETE | `/properties/:id/images/:imageId` | owner or admin | | `{ id }` |
| POST | `/properties/:id/images/:imageId/cover` | owner or admin | | `PropertyImage` |
| GET | `/me/favorites` | member | | `PropertySummary[]` |
| GET | `/me/favorites/ids` | member | | `string[]` |
| PUT | `/me/favorites/:propertyId` | member | | `{ favorited: true }` |
| DELETE | `/me/favorites/:propertyId` | member | | `{ favorited: false }` |
| POST | `/inquiries` | public, optional JWT | inquiry body | `{ id }` `201` |
| GET | `/me/inquiries` | buyer | | `Inquiry[]` |
| GET | `/agent/inquiries` | agent or admin | | `Inquiry[]` on that user's listings |
| GET | `/agent/listings` | agent or admin | | `PropertySummary[]`, every status |
| PATCH | `/inquiries/:id/status` | owner or admin | `{ status }` | `{ id, status }` |
| GET | `/me/profile` | member | | profile, including read-only `role` |
| PATCH | `/me/profile` | member | `{ fullName, phone?, avatarUrl?, agency?, licenseNo?, bio? }` | profile |
| GET | `/admin/stats` | admin | | `AdminStats` |
| GET | `/admin/moderation` | admin | | pending `PropertySummary[]` |
| GET | `/admin/users` | admin | | `DirectoryUser[]` |
| PATCH | `/admin/users/:id/role` | admin | `{ role }` | `{ id, role }` |
| GET | `/health` | public | | `{ status: "ok", db: "up" }` |

`sort` is `newest`, `price_asc`, `price_desc`, or `size_desc`. Omitted sort is `newest`, which orders by `publishedAt` descending. `q` is a case-insensitive substring match on title, neighborhood, city, province, and description. `city` is an exact match. Page size is 12. `minPrice` greater than `maxPrice` is `400`.

`GET /properties/stats` counts published listings and distinct cities. `medianPricePhp` is `percentile_cont(0.5)` over published sale prices only. After seed that is `68000000`.

A new listing is a draft with `featured` false and `agentId` set to the caller. The slug comes from the body or from the title, and a collision on a generated slug gets a suffix. Publishing sets `publishedAt` when it is still null. Repeating the current status returns `200` and does not move the row.

Allowed moves are the table in `api/src/properties/listing-transitions.ts`, which the e2e suite compares to `LISTING_TRANSITIONS` in `src/lib/domain/types.ts`.

| From | To | Roles |
| --- | --- | --- |
| draft | pending, archived | agent, admin |
| pending | published | admin |
| pending | draft | agent, admin |
| published | sold, archived | agent, admin |
| sold | archived | agent, admin |
| archived | draft | agent, admin |

Signup requires `agency` and `licenseNo` when `role` is `agent`. The password needs 8 to 72 characters, a letter, and a number. Phone values may be `+63 9XX XXX XXXX` or `09XXXXXXXXX`. The stored form is `+63 9XX XXX XXXX`. A viewing date uses `YYYY-MM-DD` and cannot be before today in Asia/Manila.

Photos are JPEG, PNG, WebP, or AVIF, at most 8 MB. `ParseFilePipe` checks size and type. `alt` is required and must be at least 3 characters. Setting a cover moves that image to position 0 and compacts the rest inside a transaction so the unique position constraint holds.

## Samples

Login:

```bash
curl -sS -H 'content-type: application/json' \
  -d '{"email":"admin@4our.estate","password":"Estate!2026"}' \
  http://localhost:4000/api/v1/auth/login
```

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "kind": "member",
      "id": "62b850bb-a02d-4201-b727-25fffc6df9d3",
      "email": "admin@4our.estate",
      "role": "admin",
      "fullName": "Elena Marquez",
      "avatarUrl": null
    }
  }
}
```

A published listing, shortened to the fields the home page uses. `GET /properties?q=siargao` returns this object in `data[0]` with `meta.total` of 1.

```json
{
  "id": "23f7d545-5a1a-43fd-bb83-92acb075b5c6",
  "slug": "siargao-cloud-nine-villa",
  "title": "Villa off Cloud 9, Siargao",
  "listingType": "sale",
  "propertyType": "villa",
  "status": "published",
  "pricePhp": 68000000,
  "bedrooms": 4,
  "bathrooms": 4,
  "floorAreaSqm": 380,
  "lotAreaSqm": 700,
  "neighborhood": "Cloud 9",
  "city": "General Luna",
  "province": "Surigao del Norte",
  "coverImage": {
    "id": "d326b775-cd34-4cc4-a26a-f0a8b42be63c",
    "url": "https://images.unsplash.com/photo-1464376810568-596bdd5a1897?auto=format&fit=crop&w=2000&q=80",
    "alt": "Still ocean at dusk fading from soft green water to a blush-pink sky",
    "position": 0
  },
  "featured": true,
  "publishedAt": "2026-01-08T02:00:00.000Z"
}
```

Create a draft. The caller must be an agent or an admin.

```bash
curl -sS -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"title":"Smoke probe house","description":"A short probe.","listingType":"sale","propertyType":"house","pricePhp":2500000,"bedrooms":2,"bathrooms":1,"floorAreaSqm":80,"parkingSlots":1,"neighborhood":"Probe","city":"Makati","province":"Metro Manila","address":"2 Probe Street"}' \
  http://localhost:4000/api/v1/properties
```

```json
{ "data": { "id": "4ecd6303-3e5c-47d1-97b5-fd4805cefc6a", "slug": "smoke-probe-house" } }
```

A signup body that fails validation:

```json
{
  "error": {
    "statusCode": 400,
    "code": "VALIDATION_FAILED",
    "message": "Check the highlighted fields.",
    "fields": {
      "fullName": "Enter your full name.",
      "email": "Enter a valid email.",
      "password": "Use 8 to 72 characters, including a letter and a number."
    }
  }
}
```

An agent moving their own draft to `sold`:

```json
{
  "error": {
    "statusCode": 403,
    "code": "FORBIDDEN",
    "message": "That status change is not allowed."
  }
}
```

## Security

- Unknown JSON fields are rejected. `role` on a profile update, and `featured` or `status` on a listing update, come back as `VALIDATION_FAILED`.
- Prisma `P2002` on a user email is `409` `An account with this email already exists.` `P2025` is `404`. Other database failures are `500` with a fixed sentence. The filter logs the driver message and does not send the stack or SQL.
- Listing copy, phones, prices, and dates are checked with class-validator before a service runs. The database checks are a second boundary.
- Image bytes are limited to 8 MB by multer and by `MaxFileSizeValidator`. `FileTypeValidator` allows JPEG, PNG, WebP, and AVIF.
- Helmet is on. `crossOriginResourcePolicy` is `cross-origin` so the Next app on port 3000 can display `/uploads` files. CORS allows `CORS_ORIGIN` and credentials. `/api/docs` uses a looser content security policy so Swagger UI can load its scripts and styles. Every other route keeps Helmet's default policy.
- In production, or when `RENDER=true`, the app sets `trust proxy` to 1. The throttler then uses the client address forwarded by Render.
- The inquiry email limit is a database count under an advisory lock, so two concurrent requests cannot both become the fifth send. The IP limits are in-memory and apply to one process.

## Demo accounts

| Email | Role |
| --- | --- |
| `admin@4our.estate` | admin |
| `isabel.santos@4our.estate` | agent, Atelier Santos |
| `mateo.cruz@4our.estate` | agent, Northbound Estates |
| `ana.reyes@4our.estate` | agent, Ridge & Plain |
| `rafael.delacruz@4our.estate` | agent, Visayas House |
| `sofia.navarro@4our.estate` | agent, Isla Norte |
| `camille.uy@4our.estate` | buyer |
| `joaquin.tan@4our.estate` | buyer |
| `bea.lim@4our.estate` | buyer |
| `clyde.lontoc@4our.estate` | buyer |

## Deploy to Render

`render.yaml` at the repo root is a Render Blueprint. It defines the Node web service `4our-estate-api` and the Postgres instance `4our-estate-db`. Both use the free plan. The service `rootDir` is `api`.

1. In the Render Dashboard, create a Blueprint from this repo.
2. When Render asks, set `CORS_ORIGIN` to the Vercel URL of the Next.js app.
3. Set `PUBLIC_API_ORIGIN` to the Render service URL, with no trailing slash.
4. Apply the Blueprint.

Render generates `JWT_SECRET`, sets `JWT_EXPIRES_IN` to `7d`, sets `NODE_VERSION` to `22`, sets `SWAGGER_ENABLED` to `true`, and copies the private database connection string into `DATABASE_URL`.

The build command is `npm ci && npm run build`. `npm ci` runs `postinstall`, which runs `prisma generate`. `npm run build` runs `prisma generate` again, then `nest build`. The start command is `npm run start:prod`. That runs `npx prisma migrate deploy`, then `node dist/main`. Render checks `GET /api/v1/health`.

After the first successful deploy, seed once from your machine. A free web service has no shell and cannot run a one-off job. Use the external database URL from the Render Postgres page. The service itself reads the private connection string Render injects as `DATABASE_URL`.

```bash
cd api
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE" npm run db:seed
```

Running the seed again updates the same demo rows.

Free plan limits, from Render's free instance documentation:

- The web service disk is ephemeral. Uploaded photos disappear when the service redeploys, restarts, or spins down. Free web services cannot attach a persistent disk.
- The web service spins down after 15 minutes without a request. The next request waits about a minute while the process starts.
- Free Postgres expires 30 days after creation. You then have 14 days to move it to a paid plan. After that, Render deletes the database. Free Postgres has no backups.
- A free web service cannot open a shell or run a one-off job. That is why the seed command runs on your machine.
