# Library

[![Framework](https://img.shields.io/badge/Framework-Next.js%2014-000000.svg?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Language](https://img.shields.io/badge/Language-TypeScript-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Styling](https://img.shields.io/badge/Styling-Tailwind%20CSS-06B6D4.svg?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-336791.svg?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![ORM](https://img.shields.io/badge/ORM-Prisma-2D3748.svg?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![AI](https://img.shields.io/badge/AI-Gemini%203%20Flash%20Preview-4285F4.svg?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Payments](https://img.shields.io/badge/Payments-LiqPay-1E6F8D.svg?style=for-the-badge&logo=liqpay&logoColor=white)](https://www.liqpay.ua/)

Library is a full-stack bookstore web app built with Next.js App Router. It recreates a dark editorial bookstore experience with catalog browsing, book details, authors, cart, checkout, LiqPay integration, orders, admin tools, and a DB-backed AI book consultant.

## Highlights

- Dark and light editorial themes with a persistent app-like shell
- Catalog, book details, similar books, reviews, and author pages
- Secure credentials auth with cookie sessions
- Cart and checkout with LiqPay flow and reservation handling
- Orders page with drawer details and tracking timeline
- Admin panel for books, comments, orders, and users
- Floating AI consultant powered by Gemini with Neon/PostgreSQL-backed tools

## Tech Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- Prisma + PostgreSQL
- React Hook Form + Zod
- TanStack Query

## Main Routes

- `/` - home
- `/books` - catalog with filters and pagination
- `/books/[bookId]` - book details, reviews, similar books
- `/authors` - authors list
- `/authors/[authorId]` - author details and books by author
- `/cart` - cart and checkout
- `/orders` - order history and tracking
- `/profile` - login/register and profile settings
- `/admin` - admin tools

## Key Features

### Storefront

- Global search with autosuggestions for books and authors
- New arrivals on the home page
- Catalog filters by genre, language, price, and stock
- Rich book detail pages with metadata, comments, and related books
- Author profile pages with biography and authored books

### User Account

- Inline login/register flow on the profile page
- Session-based authentication
- Editable profile data
- Loyalty points display

### Cart and Checkout

- Quantity controls and subtotal calculation
- Shipping fields split into city, street, and house
- Cash checkout
- LiqPay checkout with server-side reservation and verification flow

### Orders

- Order history overview
- Details drawer with purchased items and timeline
- Derived tracking stages based on order status history

### Admin

- Books CRUD
- Inline stock and price updates
- Comment moderation
- Order status updates
- User admin-role management

### AI Consultant

- Floating AI assistant widget
- Quick recommendation prompts
- Gemini server-side integration only
- Tool-backed catalog answers using real database data

## Environment Variables

Create a local `.env` file manually and set the required values:

```env
DATABASE_URL="postgresql://..."
SESSION_SECRET="your-long-random-secret"

APP_BASE_URL="http://localhost:3000"

GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-3-flash-preview"

LIQPAY_PUBLIC_KEY="your-liqpay-public-key"
LIQPAY_PRIVATE_KEY="your-liqpay-private-key"
LIQPAY_SANDBOX_MODE="1"
```

Notes:

- `GEMINI_MODEL` must be `gemini-3-flash-preview`
- `SESSION_SECRET` should be unique and strong in production
- `APP_BASE_URL` should point to your deployed domain in production
- `LIQPAY_SANDBOX_MODE="1"` enables sandbox mode; use `0` for live payments

## Local Development

Install dependencies:

```bash
npm install
```

Generate Prisma client if needed:

```bash
npm run prisma:generate
```

Run the dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run test:unit
npm run test:unit:watch
npm run test:coverage
npm run test:integration
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:prod
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

## Testing

Unit tests (Vitest):

```bash
npm run test:unit
```

Coverage report:

```bash
npm run test:coverage
```

Integration test scaffold (Vitest, Node env):

```bash
npm run test:integration
```

E2E tests (Playwright) against local app:

```bash
npm run test:e2e
```

E2E tests against deployed site (`library-weld-ten.vercel.app`):

```bash
npm run test:e2e:prod
```

Note: mutating auth/checkout e2e scenarios are skipped for external URLs to avoid polluting production data.

On first Playwright run, install browsers if prompted:

```bash
npx playwright install
```

## Build and Production

Standard production build:

```bash
npm run build
```

Start production server:

```bash
npm run start
```

### Windows Prisma note

On Windows, Prisma may occasionally fail during build if a `query-engine-windows` process remains locked. If that happens, stop the lingering process and rerun the build.

## Vercel Deployment

Recommended Vercel environment variables:

- `DATABASE_URL`
- `SESSION_SECRET`
- `APP_BASE_URL`
- `GEMINI_API_KEY`
- `GEMINI_MODEL=gemini-3-flash-preview`
- `LIQPAY_PUBLIC_KEY`
- `LIQPAY_PRIVATE_KEY`
- `LIQPAY_SANDBOX_MODE`

Additional behavior already supported by the code:

- LiqPay base URL fallback through `APP_BASE_URL`
- Vercel URL fallbacks via `VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_BRANCH_URL`, or `VERCEL_URL`
- Prisma client generation during `postinstall`

## Project Structure

```text
src/
  app/
    api/                # Route handlers for auth, cart, checkout, AI, admin
    books/              # Catalog and book detail pages
    authors/            # Author list and detail pages
    cart/               # Cart page
    orders/             # Orders page
    profile/            # Profile page
    admin/              # Admin page
  components/
    ai/                 # AI widget
    admin/              # Admin UI
    authors/            # Author cards
    books/              # Book cards, reviews, filters, covers
    cart/               # Cart and checkout UI
    layout/             # Sidebar, header, mobile nav, shell
    orders/             # Orders UI and drawer
    profile/            # Profile UI
    providers/          # Auth, cart, query, theme providers
    ui/                 # Shared UI primitives
  lib/
    ai/                 # Gemini integration and tool logic
    auth/               # Session and auth helpers
    cart/               # Cart and checkout services
    catalog/            # Catalog queries and types
    liqpay/             # LiqPay logic
    orders/             # Orders aggregation/tracking
    admin/              # Admin queries and access rules
    db/                 # Raw SQL helpers
  sql/                  # SQL files used by the app
prisma/
  schema.prisma
```

## Architecture Notes

- Browser never connects directly to PostgreSQL
- Secrets stay server-side only
- AI answers are grounded in DB-backed server tools
- LiqPay signing and verification happen on the server
- Admin access is verified server-side

## Current Limitations / Next Production Steps

The app is already functional, but for a fully hardened production launch you should still add:

- rate limiting for auth, AI, search, and admin writes
- security headers / CSP
- route-level error pages and not-found pages
- password recovery flow
- transactional email notifications
- SEO extras like sitemap and robots
- monitoring / error tracking

## Verification

Useful checks:

```bash
npm run lint
npm run build
```

## License

Private project.
