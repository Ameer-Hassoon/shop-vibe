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

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Prisma 5 + SQLite · NextAuth v4 (credentials, JWT)
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
- **Rate limiting**: in-memory limiter for login and registration. See `TRUST_PROXY` in `.env.example`.

## Getting started

Requires Node.js 20+.

```bash
cp .env.example .env
npm ci
npm run db:push     # create the SQLite schema
npm run db:seed     # admin user, coupons, demo products (safe to re-run)
npm run dev         # http://localhost:3000
```

**Demo admin login:** `admin@shop.com` / `admin12345` (set by `ADMIN_PASSWORD` in `.env`).
**Demo coupons:** `WELCOME10` (10% off, max $50), `SAVE20` ($20 off orders of $100+), `FREESHIP` (free shipping).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm test` | Vitest (unit and integration tests) |
| `npm run db:push` | Apply `prisma/schema.prisma` to the database |
| `npm run db:seed` | Idempotent demo data |
| `npm run db:generate` | Regenerate the Prisma client |

## Tests

`npm test` runs:

- unit tests for the pricing module (shipping threshold, every coupon type, max discount, minimum purchase, rounding)
- unit tests for the Zod schemas
- integration tests for `createOrder()` against a separate SQLite database (`prisma/test.db`, created
  automatically): invalid quantities, merged duplicates, out-of-stock with no partial change, coupon limits
  (including under concurrency), and stored totals matching `computeOrderTotals()`

## API overview

| Endpoint | Notes |
| --- | --- |
| `POST /api/orders` | Create an order (auth). Errors: `VALIDATION`, `PRODUCT_NOT_FOUND`, `OUT_OF_STOCK`, `COUPON_INVALID` |
| `GET /api/orders`, `GET /api/orders/[id]` | Own orders only (admins can read any) |
| `GET /api/coupons?code=X&cartTotal=N` | Validate a coupon and preview the discount |
| `/api/products`, `/api/products/[id]` | Public reads; admin-only writes |
| `/api/products/[id]/reviews` | Verified-purchase reviews (create, edit, delete) |
| `/api/admin/*` | Admin only: orders, order updates, analytics |
