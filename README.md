# Souq: bilingual e-commerce storefront

A full-stack online shop in **English and Arabic (RTL)** with a real checkout: server-side pricing,
transactional orders with race-safe stock handling, coupons, reviews, a wishlist and an admin dashboard.
Built as a portfolio project with an emphasis on correctness and security rather than just screens.

<!-- screenshots -->

## Features

- Product catalogue with search, category/price/rating filters, sorting and pagination
- Cart, wishlist and a cash-on-delivery checkout (shipping, tax and COD fee breakdown)
- Coupons: percentage, fixed amount, free shipping, minimum purchase, max discount, usage limits
- Orders with a status lifecycle (`PENDING` to `DELIVERED`, or `CANCELLED` with stock restore)
- Verified-purchase reviews with automatic rating recalculation
- Admin area: orders, analytics, product management (role protected)
- Email order confirmations (optional, via Resend)
- English / Arabic with full RTL layout, light and dark themes

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Prisma 5 + PostgreSQL · NextAuth v4 (credentials, JWT)
· next-intl 4 · Zustand · Zod · Vitest

## Architecture notes

- **Pricing module** (`src/lib/pricing.ts`): one pure function, `computeOrderTotals()`, is used by the
  checkout page for the preview and by the API for the authoritative total. It works in integer cents to
  avoid floating point drift. The server ignores any prices or totals sent by the client.
- **Transactional orders** (`src/lib/orders.ts`): `createOrder()` runs in one database transaction. Stock
  and coupon usage are claimed with conditional updates (`stock >= qty`, `usageCount < limit`), so concurrent
  orders can neither oversell a product nor exceed a coupon limit, and a failed order changes nothing.
- **Auth and roles** (`src/lib/auth.ts`): NextAuth credentials with bcrypt and JWT sessions. API routes use
  `requireUser()` / `requireAdmin()`, which return the user or a ready 401/403 response. Orders are queried
  scoped to the owner, so other users' order ids return 404. `src/proxy.ts` (Next 16's replacement for
  middleware) redirects anonymous or non-admin visitors away from `/{locale}/admin`.
- **Validation** (`src/lib/validation.ts`): Zod schemas for every write endpoint. Failures return
  `{ error, code: "VALIDATION", fields }` with per-field messages.
- **i18n / RTL**: `next-intl` with locale-prefixed routes (`/en`, `/ar`), message files in `messages/`,
  and logical CSS properties (`ms-*`, `pe-*`, `text-start`) so layouts mirror automatically.
- **Rate limiting** (`src/lib/rateLimit.ts`): login and registration limits are counted in Postgres with
  one atomic upsert, so they hold across serverless instances. Keys are SHA-256 hashed, so no IPs or
  emails are stored. See `TRUST_PROXY` in `.env.example`.
- **Read-only demo admin**: the account in `DEMO_ADMIN_EMAIL` can open the whole back office, but every
  admin write goes through `requireAdminWrite()` and is refused with `DEMO_READ_ONLY`, and customer
  names, emails, phones and addresses are masked. Its login can be shared publicly.

## Getting started

Requires Node.js 20+ and PostgreSQL (the included `docker-compose.yml` starts one).

```bash
cp .env.example .env
docker compose up -d   # Postgres on localhost:5432, plus the shop_test database for tests
npm ci
npm run db:deploy      # apply the migrations in prisma/migrations
npm run db:seed        # admins, coupons, demo products (safe to re-run)
npm run dev            # http://localhost:3000
```

**Demo admin (read-only):** `demo-admin@shop.com` / `demo12345` (`DEMO_ADMIN_*` in `.env`).
**Full admin:** `admin@shop.com` with `ADMIN_PASSWORD` from `.env`. Keep this one private.
**Demo coupons:** `WELCOME10` (10% off, max $50), `SAVE20` ($20 off orders of $100+), `FREESHIP` (free shipping).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm test` | Vitest (unit and integration tests) |
| `npm run db:migrate` | Create a migration after changing `prisma/schema.prisma` (development) |
| `npm run db:deploy` | Apply pending migrations |
| `npm run db:seed` | Idempotent demo data |
| `npm run db:generate` | Regenerate the Prisma client |

## Tests

`npm test` runs:

- unit tests for the pricing module (shipping threshold, every coupon type, max discount, minimum purchase, rounding)
- unit tests for the Zod schemas
- integration tests for `createOrder()` and admin order updates against a separate Postgres database
  (`shop_test`, wiped on every run; override with `TEST_DATABASE_URL`): invalid quantities, merged
  duplicates, out-of-stock with no partial change, coupon limits (including under concurrency), status
  transitions, and stored totals matching `computeOrderTotals()`
- the database rate limiter (atomic under concurrency, window expiry) and the demo admin's data masking

## Deploying to Vercel

1. Create a Postgres database (for example on [Neon](https://neon.tech), free tier) and copy its pooled
   and direct connection strings.
2. Import the repository in Vercel and set the environment variables from `.env.example`:
   `DATABASE_URL` (pooled), `DIRECT_URL` (direct), `NEXTAUTH_SECRET` (`openssl rand -base64 32`),
   `NEXTAUTH_URL` (your site URL), `ADMIN_PASSWORD` (a strong private one), `DEMO_ADMIN_EMAIL`,
   `DEMO_ADMIN_PASSWORD` and `TRUST_PROXY=true`.
3. Deploy. The `vercel-build` script runs `prisma migrate deploy` before `next build`.
4. Seed once from your machine: `DATABASE_URL=<direct url> DIRECT_URL=<direct url> npm run db:seed`
   with the same admin variables.

## API overview

| Endpoint | Notes |
| --- | --- |
| `POST /api/orders` | Create an order (auth). Errors: `VALIDATION`, `PRODUCT_NOT_FOUND`, `OUT_OF_STOCK`, `COUPON_INVALID` |
| `GET /api/orders`, `GET /api/orders/[id]` | Own orders only (admins can read any) |
| `GET /api/coupons?code=X&cartTotal=N` | Validate a coupon and preview the discount |
| `/api/products`, `/api/products/[id]` | Public reads; admin-only writes |
| `/api/products/[id]/reviews` | Verified-purchase reviews (create, edit, delete) |
| `/api/admin/*` | Admin only: orders, order updates, analytics |
