# 4OUR Estate API

NestJS service for listings, accounts, inquiries, and favorites. The HTTP contract and the role rules are in [docs/api.md](../docs/api.md).

```bash
docker compose up -d postgres
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

The API listens on port 4000. Swagger UI is at `/api/docs`. `npm run test:e2e` uses the `estate_test` database. Production start is `npm run start:prod`, which applies migrations and then listens. The Render Blueprint is `render.yaml` at the repo root.
