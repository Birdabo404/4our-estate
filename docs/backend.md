# Backend

The API lives in `api/`. Routes, roles, and how to run it are in [api.md](api.md).

The Next.js app calls that API from `src/lib/data` and `src/lib/actions`. A signed-in browser holds an httpOnly cookie named `estate_session`. `src/proxy.ts` sends a request for `/dashboard/*` to `/login?next=` when that cookie is missing or its expiry has passed.
