# E-Commerce Shop

A full-featured e-commerce web application built with Next.js, TypeScript, Tailwind CSS, Prisma, and PostgreSQL.

## Features

- **Product Catalog**: Browse, search, and view product details
- **Shopping Cart**: Add/remove items, update quantities, persist in localStorage
- **User Authentication**: Login/register with NextAuth.js
- **Admin Dashboard**: Create, edit, and delete products
- **Role-Based Access**: Admin-only routes protected with middleware
- **Responsive Design**: Mobile and desktop friendly

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **State Management**: Zustand

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database URL and secrets
```

3. Set up the database:
```bash
npx prisma db push
npm run db:seed
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Default Admin Account

After seeding the database, you can login with:

- **Email**: admin@shop.com
- **Password**: admin123

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | Get all products |
| POST | /api/products | Create product (admin) |
| GET | /api/products/[id] | Get single product |
| PUT | /api/products/[id] | Update product (admin) |
| DELETE | /api/products/[id] | Delete product (admin) |

## Project Structure

```
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed script
├── src/
│   ├── app/
│   │   ├── admin/         # Admin dashboard
│   │   ├── api/           # API routes
│   │   ├── cart/          # Cart page
│   │   ├── login/         # Login page
│   │   ├── product/       # Product details
│   │   ├── register/      # Registration page
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Home page
│   ├── components/        # Reusable components
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities (Prisma client)
│   ├── providers/         # React providers
│   ├── store/             # Zustand stores
│   └── types/             # TypeScript types
├── middleware.ts          # Route protection
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes
- `npm run db:seed` - Seed database with sample data

## Deployment

The app can be deployed to Vercel or any Node.js hosting platform. Make sure to:

1. Set up a PostgreSQL database
2. Configure environment variables
3. Run `npm run build` before deployment
