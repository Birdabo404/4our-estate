# 4OUR Estate

Homes for sale and lease in the Philippines. Real photos, prices in pesos.

[Live demo](https://4our-estate.vercel.app)

<img src="docs/readme/listing.jpg" alt="Listing page for a villa in Diniwid, Boracay" width="720">

Guests browse and inquire. Buyers save homes. Agents list. Admins moderate. Built for the ITE 18 midterm.

Next.js 16 and Tailwind on the web. NestJS, Prisma, and PostgreSQL on the API.

## Run

Node 22 and Docker.

```bash
npm install
npm --prefix api install
cp .env.example .env.local
cp api/.env.example api/.env
npm run db:up
npm run db:migrate
npm run db:seed
npm run api:dev    # http://localhost:4000
npm run dev        # http://localhost:3000
```

Swagger is at http://localhost:4000/api/docs.

No database: `DATA_MODE=mock npm run dev`. The app serves the seed data from memory. Changes last until that process stops, and photo uploads need the API. The live demo runs this way, so a saved home or a new listing can be missing on the next load. Point `API_URL` at the Render API when writes should stick.

Every demo account uses the password `Estate!2026`.

| Role | Email |
| --- | --- |
| Admin | `admin@4our.estate` |
| Agent | `isabel.santos@4our.estate` |
| Buyer | `clyde.lontoc@4our.estate` |

Sign-in lists the other accounts.

```bash
npm run api:test      # API, against estate_test
npm run e2e:public    # browser, both servers running
npm run e2e:app
```

## More

- Design: [DESIGN.md](DESIGN.md), and `/styleguide` in the app
- API: [docs/api.md](docs/api.md)
- Service: [api/README.md](api/README.md)
- Hosting: Vercel for the site, Render for the API and database (`render.yaml`)
