# Detailed Plan For Rebuilding The Qt Application As A Website

## Ready Tech Prompt For Another AI

Copy and paste the following prompt into another AI if you want it to start implementation immediately.

```text
You are rebuilding an existing Qt/QML desktop bookstore application as a website.

Your task is to recreate the current application as closely as possible in both design and functionality.

Core requirement:
- Do NOT redesign, simplify, modernize away, or replace the product with a generic bookstore template.
- Recreate the product with visual and functional parity.
- Treat the existing repo as the source of truth.

Mandatory stack:
- Next.js 14+ App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- Prisma
- PostgreSQL
- React Hook Form
- Zod
- TanStack Query

Architecture requirements:
- Browser client + server-side API/business logic + PostgreSQL
- No direct database access from the browser
- No payment secrets in the client
- No admin logic trusted on the client
- Gemini and LiqPay integrations must run through the server

Design requirements:
- Preserve the current dark editorial visual style
- Preserve the left sidebar app shell on desktop
- Preserve the giant serif page titles and clean sans-serif body text
- Preserve the subtle glass panels, thin translucent borders, restrained grayscale palette, and premium hover/motion behavior
- Do not introduce bright generic ecommerce colors or dashboard styling
- UI language should remain Ukrainian

Use these files as the primary product reference:
- qml/main.qml
- qml/pages/*.qml
- qml/components/*.qml
- qml_models/*.h
- qml_models/theme.h
- qml_models/theme.cpp
- core/database.h
- models/datatypes.h
- sql/schema.sql
- website_rebuild_plan.md

Required routes/pages:
- /
- /books
- /books/[bookId]
- /authors
- /authors/[authorId]
- /cart
- /orders
- /profile
- /admin

Required features:
- global search with autosuggestions for books and authors
- home page with editorial feel and new arrivals
- books catalog with filters
- book details with comments, rating, metadata, similar books, add to cart
- authors list and author details with books by author
- profile page with inline login/register for guests and editable profile for logged-in users
- cart with quantity controls
- checkout form with city, street, and house fields
- payment methods: cash, card, LiqPay Sandbox
- LiqPay reservation flow that temporarily holds stock before payment is confirmed
- orders page with order details drawer and tracking timeline
- admin panel with books, comments, orders, and users management
- floating AI assistant widget backed by Gemini through server-side tools

Critical business logic to preserve:
- adding to cart from multiple places
- auth gating for cart/orders
- admin gating for admin page
- reservation creation before LiqPay payment
- reservation release on cancel/failure/expiry
- order creation after successful payment verification
- tracking based on order status history

Implementation rules:
- Build production-structured code, not a mockup
- Preserve existing product behavior unless a web-specific change is required for security
- If behavior differs from a typical web store, follow the existing app, not convention
- Keep parity first, improvements second

Deliver the implementation in phases:
1. app shell and theme
2. read-only storefront pages
3. auth and profile
4. cart and standard checkout
5. LiqPay plus reservation flow
6. orders and tracking
7. AI chat
8. admin panel
9. final parity polish

When making decisions, optimize for: parity with the current desktop application, security, and maintainability.
```

This document is a detailed implementation specification for recreating the current desktop Qt/QML application as a web application while preserving the existing product as closely as possible.

The goal is not "make a website inspired by the app".
The goal is:

- preserve the current information architecture;
- preserve the current visual language;
- preserve the current user flows;
- preserve the current business logic;
- preserve the current Ukrainian UI copy where it already exists;
- preserve admin features, checkout behavior, reservation logic, order tracking logic, AI chat behavior, and search behavior.

This file is intentionally written as a handoff/specification that can be given to another AI or to a developer team.

---

## 1. Main Objective

Rebuild the current desktop application as a modern website that:

- looks as close as possible to the existing Qt/QML application;
- behaves as close as possible to the existing Qt/QML application;
- keeps the same pages, components, states, and interactions;
- uses a real web architecture with server-side business logic;
- reuses the current PostgreSQL schema and business concepts where possible;
- moves all sensitive logic out of the client.

Important: the website must not "simplify" the product into a generic bookstore template. It must preserve the app's specific structure and tone.

---

## 2. Non-Negotiable Product Rules

If another AI implements the website, it must follow these rules:

1. Do not redesign the product into a generic e-commerce template.
2. Do not remove the left persistent sidebar unless a mobile breakpoint requires a compact variant.
3. Do not replace the visual language with bright colors, generic cards, purple accents, or standard dashboard themes.
4. Keep the UI language Ukrainian unless multilingual support is added later as an extra feature.
5. Keep the same page structure:
   - home
   - books
   - book details
   - authors
   - author details
   - cart
   - orders
   - profile
   - admin
6. Keep the same major product flows:
   - browse/search books
   - browse/search authors
   - login/registration on profile page
   - add to cart from multiple places
   - checkout with city/street/house fields
   - LiqPay checkout with reservation hold
   - order history with tracking timeline
   - admin content management
   - AI assistant chat
7. Keep the current dark, restrained, editorial look.
8. Keep the same typography spirit: serif display headings + clean sans-serif body text.
9. Keep subtle glass/transparency/border treatment.
10. Keep the order details drawer behavior and not replace it with a totally different layout.

---

## 3. Recommended Web Stack

Use a stack that another AI can implement reliably and quickly.

If only one stack choice is allowed, use this exact stack:

- `Next.js 14+`
- `TypeScript`
- `Tailwind CSS`
- `Framer Motion`
- `Prisma`
- `PostgreSQL`
- `React Hook Form`
- `Zod`
- `TanStack Query`

This is the preferred and final recommendation for the website rebuild.

Recommended target stack:

- Frontend + BFF: `Next.js 14+` with `App Router`
- Language: `TypeScript`
- Styling: `Tailwind CSS` + CSS variables for theme tokens
- Animation: `Framer Motion`
- Forms: `React Hook Form` + `Zod`
- Data fetching/cache: `TanStack Query`
- Local UI state: `Zustand` or lightweight React context
- ORM: `Prisma`
- Database: `PostgreSQL`
- Auth: credentials auth with `httpOnly` cookie session or JWT session stored in secure cookies
- Payments: server-side LiqPay integration + webhook/callback handling
- AI: server-side Gemini proxy endpoint with tool calling to DB-backed search functions
- Image storage:
  - local/static for initial migration, or
  - S3-compatible storage later if needed

Why this stack:

- easy for AI coding assistants to generate;
- supports SSR + client interactivity;
- good fit for dashboard/admin + storefront + auth + payments;
- makes it easy to keep one codebase for both UI and API routes.

Alternative acceptable stack:

- frontend: React + Vite + TypeScript
- backend: NestJS or Fastify
- ORM: Prisma

But if the goal is fastest high-quality AI implementation, the preferred option is full-stack Next.js.

### 3.1 Final stack decision

The implementation should be done with:

- frontend and server rendering: `Next.js 14+ App Router`
- language: `TypeScript`
- styling: `Tailwind CSS`
- animation: `Framer Motion`
- forms and validation: `React Hook Form + Zod`
- server/database layer: `Prisma + PostgreSQL`
- client data fetching: `TanStack Query`
- authentication: secure cookie-based auth
- payments: server-side `LiqPay` integration
- AI integration: server-side `Gemini` proxy and tool-calling layer

### 3.2 Why this stack is the best fit

- it is the easiest modern stack for another AI to generate consistently;
- it supports both a polished storefront and a complex admin area;
- it is very suitable for app-like UI with drawers, panels, filters, and floating widgets;
- it makes it easy to keep frontend and backend logic in one codebase;
- it is safer for payment logic because secrets stay on the server;
- it works well with PostgreSQL, which already exists in this project;
- it is a strong fit for recreating the current desktop app with high visual and functional parity.

### 3.3 Stacks that are not recommended for this migration

Avoid these options unless there is a very strong reason:

- `WordPress`
- `Flutter Web`
- `Angular`
- `Laravel + Blade` for the main UI layer
- any stack that would push database logic or payment signing logic into the browser

These options are not ideal for reproducing the current application 1:1 as a high-quality website.

---

## 4. Current Desktop App Architecture That Must Be Translated

Current app architecture in practice:

- QML UI pages/components
- C++/Qt view-model-like bridge in `qml_models/`
- database access/business logic in `core/database.h` + `models/`
- PostgreSQL as the source of truth
- direct DB access from desktop client

Web target architecture:

- browser frontend for rendering and client interaction
- backend/API layer for all business logic
- PostgreSQL for persistence

Desktop anti-patterns that must not be copied into the web app:

- no direct database access from browser;
- no client-side payment signing secrets;
- no client-side privileged admin operations;
- no Gemini API key in browser if avoidable.

---

## 5. Source Files That Define Current Product Behavior

These source files are the best parity references and should be treated as the authoritative product spec.

### App shell and navigation

- `qml/main.qml`
- `qml/components/Sidebar.qml`

### Core pages

- `qml/pages/HomePage.qml`
- `qml/pages/BooksPage.qml`
- `qml/pages/BookDetailsPage.qml`
- `qml/pages/AuthorsPage.qml`
- `qml/pages/AuthorDetailsPage.qml`
- `qml/pages/CartPage.qml`
- `qml/pages/OrdersPage.qml`
- `qml/pages/ProfilePage.qml`
- `qml/pages/AdminPage.qml`

### Shared components

- `qml/components/BookCard.qml`
- `qml/components/BookCardHome.qml`
- `qml/components/AuthorCard.qml`
- `qml/components/CommentItem.qml`
- `qml/components/StarRating.qml`
- `qml/components/AiChatWidget.qml`
- `qml/components/LiqPayCheckoutOverlay.qml`

### View-model / behavior layer

- `qml_models/appcontext.h`
- `qml_models/booklistmodel.h`
- `qml_models/bookdetailsmodel.h`
- `qml_models/authorlistmodel.h`
- `qml_models/authordetailsmodel.h`
- `qml_models/cartmodel.h`
- `qml_models/ordersmodel.h`
- `qml_models/profilemodel.h`
- `qml_models/adminmodel.h`
- `qml_models/geminiclient.h`

### Theme and visual tokens

- `qml_models/theme.h`
- `qml_models/theme.cpp`

### Data model and database behavior

- `core/database.h`
- `models/datatypes.h`
- `sql/schema.sql`

---

## 6. Exact Product Scope To Rebuild

The website must include all of the following modules.

### 6.1 Public browsing

- Home page
- Book catalog
- Book details
- Authors list
- Author details
- Global search suggestions
- AI assistant widget

### 6.2 Authenticated user features

- Login
- Registration
- Logout
- Profile editing
- Cart
- Checkout
- Order history
- Order details and tracking
- Reviews/comments on books

### 6.3 Admin-only features

- Book management
- Comment moderation
- Order status updates
- User role management
- Inline stock increase
- Inline price update

### 6.4 Payment and reservation system

- normal checkout
- LiqPay sandbox checkout
- reservation hold before payment completion
- reservation release on cancel/failure/expiry
- order creation after successful verification

---

## 7. Design System Specification

The website should preserve the application's current design DNA.

### 7.1 Theme palette

Take these values directly from the current theme:

- `bgBody`: `#030303`
- `bgCard`: `rgba(255,255,255,0.01)` approximate desktop equivalent
- `glassPanel`: `rgba(20,20,20,0.59)`
- `borderLight`: `rgba(255,255,255,0.08)`
- `borderHover`: `rgba(255,255,255,0.20)`
- `textPrimary`: `#ffffff`
- `textSecondary`: `#888888`
- `textMuted`: `#666666`
- `spotlightColor`: `rgba(255,255,255,0.12)`
- `accentWhite`: `#ffffff`
- `cardHover`: `rgba(255,255,255,0.05)`
- `success`: `#4CAF50`
- `info`: `#2196F3`
- `warning`: `#FF9800`
- `error`: `#ff4444`

Important design note:

- do not overuse `success/info/warning` in the UI;
- the current app works best when most surfaces stay grayscale/white-on-black;
- reserve red mostly for errors/cancel states;
- keep the aesthetic premium and restrained.

### 7.2 Typography

Preserve the typography hierarchy:

- Display heading font: `Playfair Display`
- Display italic heading font: `Playfair Display Italic`
- Body font: `Inter`
- Windows fallback in current app: `Georgia` for display, `Segoe UI` for body

Web font recommendation:

- load `Playfair Display` from Google Fonts
- load `Inter` from Google Fonts

Typography usage rules:

- main page titles: serif, large, elegant
- content labels and buttons: sans-serif
- captions: uppercase, small, spaced letters

### 7.3 Spacing scale

Map the current theme spacing:

- XS = 4
- S = 8
- M = 16
- L = 24
- XL = 40
- XXL = 60

### 7.4 Radius scale

- sharp = 4
- soft = 8
- pill = 30
- round = 50%

### 7.5 Core visual rules

- background must remain extremely dark, almost black;
- cards should be translucent or very low-opacity dark panels;
- borders should be subtle white translucent strokes;
- avoid flat generic white cards;
- hover states should be subtle and premium;
- use lift, scale, opacity, and border transitions, not loud shadows;
- buttons should often be outlined white or white-fill-on-hover.

### 7.6 Motion rules

- sidebar/nav hover: fast opacity/border/color animation
- cards: subtle lift on hover
- large cards: soft spotlight/radial hover effect where appropriate
- drawers and filter panels: smooth slide motion
- chat widget: scale + fade in/out
- avoid bouncy or playful motion; keep it elegant

---

## 8. Layout Specification

### 8.1 App shell

The website should feel app-like, not blog-like.

Desktop shell:

- fixed left sidebar
- main content area to the right
- top header inside content area
- page content below header

Current desktop references:

- app width target: around `1500x800`
- minimum supported width in desktop app: `900`
- sidebar width: roughly `100-120px`
- header height: `120px`

### 8.2 Sidebar

Preserve these characteristics:

- left glass panel
- rotated `LIBRARY` brand text near top
- icon-only nav stack
- white active indicator bar on active item
- hover tooltip labels
- cart badge with count
- admin nav item only visible for admin users

### 8.3 Header

Preserve these characteristics:

- giant page title on left
- search field on right
- search is underlined/minimal, not boxed generic search
- autosuggest dropdown for books and authors

### 8.4 Mobile adaptation

The current app is desktop-first. The web version should remain desktop-first too.

Recommended mobile adaptation:

- convert sidebar to off-canvas nav below `900px`
- keep typography scale similar but reduced
- keep card shapes and styling consistent
- do not completely redesign page layouts for mobile unless necessary

---

## 9. Route Map

Use these website routes.

- `/` -> home
- `/books` -> catalog
- `/books/[bookId]` -> book details
- `/authors` -> authors list
- `/authors/[authorId]` -> author details
- `/cart` -> cart and checkout
- `/orders` -> order history
- `/profile` -> guest auth + logged-in profile
- `/admin` -> admin panel

Optional internal UI states:

- order details can remain a drawer inside `/orders`
- filters can remain a slide-over panel inside `/books`
- AI chat remains globally mounted, floating on all pages

---

## 10. Page-By-Page Functional Specification

## 10.1 Home page

Reference behavior:

- strong hero section
- CTA to open catalog
- section of new arrivals
- books shown as editorial cards

Required content:

- large hero heading in serif display font
- one main CTA button leading to catalog
- new arrivals section using `BookCardHome`-like cards
- clicking a book opens its details page

Do not simplify into a generic carousel-only homepage.

## 10.2 Books page

Required behavior:

- show count of results
- adaptive grid/flow of books
- each book card shows:
  - cover
  - title
  - authors
  - price
  - stock-dependent add-to-cart button
- global search can navigate here and auto-apply query
- filters panel slides from the side

Filters to support:

- genres
- languages
- min price
- max price
- in stock only

Important UX rule:

- filter panel should feel like the current app's side sheet, not a standard marketplace sidebar.

## 10.3 Book details page

Required content:

- back navigation
- large cover art
- title
- authors
- genre
- language
- publisher
- publication date
- ISBN
- page count
- stock status
- price
- aggregated rating
- add-to-cart action
- description
- review form
- review list
- similar books section

Review flow:

- guests cannot post reviews
- logged-in users can submit one review with text and rating
- show existing comments with author name, date, rating, text

Similar books:

- show books from the same genre or similar catalog subset
- allow direct navigation + add-to-cart

## 10.4 Authors page

Required behavior:

- grid/flow of authors
- author card shows image, name, nationality or short metadata
- click opens author details

## 10.5 Author details page

Required content:

- back navigation
- author portrait
- name
- nationality
- birth date
- biography
- books by that author

Each author book tile/card must allow:

- open book details
- add to cart

## 10.6 Profile page

This page must preserve the existing unusual but important behavior:

- guest auth and registration are embedded in the profile page itself;
- not a separate login page;
- not a modal-only flow.

Guest state requirements:

- login mode
- registration mode
- toggle between modes
- inline validation errors

Registration fields:

- first name
- last name
- email
- phone
- password
- confirm password

Logged-in state requirements:

- display profile identity block
- show loyalty program / loyalty points
- editable fields:
  - first name
  - last name
  - phone
- email remains read-only
- save action
- logout action

Note:

- current backend/profile model supports address, but current profile UI does not actively expose it as a main editable field;
- preserve visible parity unless the migration explicitly decides to improve it.

## 10.7 Cart page

This page has two main states.

### State A: cart review

- list all cart items
- each row shows:
  - cover
  - title
  - author
  - price per unit
  - quantity controls
  - subtotal
  - remove/decrease/increase actions
- show total amount
- show checkout trigger button

### State B: checkout form

Current parity requirements:

- back to cart button
- title and supporting text
- address split into:
  - city
  - street
  - house
- payment method selector:
  - `Готівка`
  - `Картка`
  - `LiqPay Sandbox`
- secure notice line
- final confirmation button

Validation requirements:

- city must be non-empty and human-readable
- street must be non-empty and contain letters
- house must be non-empty and valid house format
- composed shipping address should still be assembled into one string for DB compatibility if schema is unchanged

## 10.8 Orders page

This page must preserve the current structure.

Main list:

- show order history entries
- each row should expose at minimum:
  - order ID
  - date
  - total
  - status
  - item count

Order details behavior:

- clicking an order opens a right-side details drawer/panel
- do not replace with full page unless absolutely necessary

Inside the drawer:

- title block
- order number
- status badge
- metrics block/cards:
  - amount
  - payment method
  - item/status counts
  - shipping address
- delivery tracking summary
- progress bar
- ETA / delivery message
- tracking number block
- timeline stages
- raw status history
- purchased items list

Tracking logic:

- derived from order statuses stored in DB
- synthetic stages:
  - created
  - confirmed
  - processing
  - shipped
  - delivered
- canceled orders override ETA/progress behavior

## 10.9 Admin page

Preserve admin as a single rich panel with sections/tabs.

Required admin modules:

### Books management

- list books
- add book
- update book
- delete book
- change price inline
- increase stock inline
- filter/search books
- highlight low stock

### Comments moderation

- list comments
- search/filter comments
- delete comment

### Orders management

- list orders
- inspect status/customer/address/amount
- add status update
- add tracking number

### Users management

- list users
- search users
- filter admin-only
- see loyalty points
- toggle admin role

---

## 11. Global Features To Preserve

## 11.1 Global search

Requirements:

- search input in header
- autosuggest after 2+ characters
- suggestions for both books and authors
- selecting a suggestion deep-links to the corresponding detail page
- pressing Enter should run a book search and open `/books`

Suggestion item fields:

- type: `book` or `author`
- id
- display text
- optional image
- optional price for books

## 11.2 AI chat widget

This is a global floating assistant, not a page feature.

Required behavior:

- floating launcher bubble/button
- bottom-right chat window
- open/close animation
- first default assistant greeting
- user message bubbles and AI message bubbles
- loading/typing state
- API-not-configured state
- error state
- preserve last ~10 messages of conversation context

AI logic requirements:

- must use tool-backed DB lookups for factual book/author data
- must not hallucinate prices, stock, authors, or titles
- should have server-side tool functions:
  - search books
  - get book details
  - search authors
  - get author books

## 11.3 Cart access gating

- guests can browse but cannot fully use cart/orders workflows
- if guest tries to access `cart` or `orders`, redirect to `profile` and show explanatory message

## 11.4 Admin access gating

- non-admins cannot access `/admin`
- redirect to home or profile with a message

---

## 12. Database Model To Preserve

The web app should reuse the current PostgreSQL schema concepts as much as possible.

Main tables/entities currently in use:

- `customer`
- `publisher`
- `author`
- `book`
- `book_author`
- `comment`
- `cart_item`
- `order`
- `order_item`
- `order_status`
- `payment_transaction`
- `payment_status_history`
- `book_reservation`
- `book_reservation_item`

Important model semantics:

- books can have many authors via `book_author`
- comments belong to book + customer
- cart items belong to customer + book
- orders belong to customer
- order items belong to order + book
- order statuses represent history and tracking source
- payment transaction stores provider data and verification state
- book reservation temporarily holds stock during LiqPay checkout

Suggested migration approach:

- keep business tables compatible with current schema;
- add only web-specific tables if needed, for example:
  - `session`
  - `refresh_token`
  - `file_upload`
  - audit logs if desired

---

## 13. Backend Responsibility Split

Everything that is sensitive or authoritative must move to the server.

Server responsibilities:

- authentication
- session issuing and validation
- password verification and hashing
- profile updates
- search suggestion queries
- catalog filtering/search
- book details aggregation
- author details aggregation
- cart CRUD
- checkout validation
- order creation
- stock checks
- reservation creation/release/cleanup
- LiqPay signature generation
- LiqPay callback/webhook verification
- payment status persistence
- AI tool execution for catalog lookups
- all admin operations

Browser responsibilities:

- rendering
- local UI state
- optimistic UI only where safe
- form interactions
- calling API endpoints

---

## 14. Authentication Specification

Current auth rules from desktop app should be preserved.

Validation rules:

- first/last name: 2..40 chars, letters/apostrophe/hyphen/space
- email: valid email format
- phone: 10..15 digits with optional `+`
- password: at least 8 chars, contains letters and digits

Recommended web implementation:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `GET /api/auth/session`

Session strategy:

- secure `httpOnly` cookie
- server-side session lookup or signed JWT in cookie

Password strategy:

- preserve strong hashing on server
- if current DB already stores PBKDF2-based upgraded hashes, keep compatibility

---

## 15. API Contract Outline

Below is a practical API outline for the web rebuild.

## 15.1 Auth

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `GET /api/auth/session`

## 15.2 Profile

- `GET /api/profile`
- `PATCH /api/profile`

## 15.3 Search

- `GET /api/search/suggestions?q=...&limit=8`

## 15.4 Books

- `GET /api/books`
  - supports query params for search/filtering
- `GET /api/books/new-arrivals`
- `GET /api/books/popular`
- `GET /api/books/:bookId`
- `GET /api/books/:bookId/similar`
- `GET /api/books/:bookId/comments`
- `POST /api/books/:bookId/comments`

## 15.5 Authors

- `GET /api/authors`
- `GET /api/authors/:authorId`

## 15.6 Cart

- `GET /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:bookId`
- `DELETE /api/cart/items/:bookId`
- `DELETE /api/cart`

## 15.7 Checkout / Orders

- `POST /api/checkout/order`
- `POST /api/checkout/liqpay/start`
- `POST /api/checkout/liqpay/verify`
- `POST /api/checkout/liqpay/cancel`
- `GET /api/orders`
- `GET /api/orders/:orderId`

## 15.8 Admin

- `GET /api/admin/books`
- `POST /api/admin/books`
- `PATCH /api/admin/books/:bookId`
- `PATCH /api/admin/books/:bookId/price`
- `PATCH /api/admin/books/:bookId/stock`
- `DELETE /api/admin/books/:bookId`
- `GET /api/admin/comments`
- `DELETE /api/admin/comments/:commentId`
- `GET /api/admin/orders`
- `POST /api/admin/orders/:orderId/status`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:customerId/admin-role`

## 15.9 AI

- `POST /api/ai/chat`

---

## 16. Data Shapes Needed By The Frontend

Use the current C++ data structures as the parity source.

### Book card / catalog item

- `bookId`
- `title`
- `authors`
- `price`
- `coverImagePath`
- `stockQuantity`
- `genre`

### Book details

- `bookId`
- `title`
- `authors`
- `price`
- `coverImagePath`
- `stockQuantity`
- `genre`
- `description`
- `publisherName`
- `publicationDate`
- `isbn`
- `pageCount`
- `language`
- `averageRating`
- `comments[]`
- `similarBooks[]`

### Comment

- `authorName`
- `commentDate`
- `rating`
- `commentText`

### Author details

- `authorId`
- `firstName`
- `lastName`
- `nationality`
- `imagePath`
- `biography`
- `birthDate`
- `books[]`

### Profile

- `customerId`
- `firstName`
- `lastName`
- `email`
- `phone`
- `address`
- `joinDate`
- `loyaltyProgram`
- `loyaltyPoints`

### Order details

- `orderId`
- `orderDate`
- `totalAmount`
- `status`
- `shippingAddress`
- `paymentMethod`
- `items[]`
- `statuses[]`

### Search suggestion

- `displayText`
- `type`
- `id`
- `imagePath`
- `price`

---

## 17. LiqPay + Reservation Flow Specification

This is one of the most important flows and must not be simplified incorrectly.

Current intended behavior:

1. User fills checkout form.
2. User chooses `LiqPay Sandbox`.
3. Server validates cart and address.
4. Server creates `book_reservation` and `book_reservation_item`.
5. Server decreases available stock as part of reservation hold.
6. Server creates `payment_transaction` with provider order ID.
7. Server signs LiqPay request and returns checkout payload.
8. Frontend opens payment overlay/page.
9. User pays or cancels.
10. Server verifies returned payment data.
11. If successful:
    - create order using reservation token
    - mark reservation completed
    - attach payment to order
    - append payment status history
12. If canceled/failed/expired:
    - release reservation
    - restore stock
    - mark reservation canceled/expired

Web implementation recommendation:

- generate LiqPay `data` + `signature` only on the server;
- use server callback/webhook endpoint if possible;
- keep a manual verification endpoint for parity with the current overlay flow;
- persist all provider responses and signatures.

Critical rule:

- another user must not be able to buy the same stock while the first user is inside the LiqPay flow and reservation is active.

---

## 18. Order Tracking Specification

The order tracking UI is based on status history, not external shipment tracking.

Required derived stages:

1. `Створено`
2. `Підтверджено`
3. `Комплектація`
4. `В дорозі`
5. `Доставлено`

Rules:

- calculate current stage from latest matching status
- compute progress percent from current stage index
- if canceled, override ETA/progress presentation
- if delivered, show delivered state instead of estimated delivery window
- tracking number is optional and comes from status history

Do not replace this with a completely different shipment library unless it reproduces the same visible output.

---

## 19. Admin Specification In Detail

## 19.1 Books admin

Capabilities:

- create book
- edit book fields
- delete book
- increase stock by integer amount
- update price
- list/search/filter books

Fields used by admin:

- title
- price
- stock quantity
- genre
- language
- description
- cover image path

## 19.2 Comments admin

Capabilities:

- list comments
- inspect comment metadata
- delete comment

## 19.3 Orders admin

Capabilities:

- list all orders
- inspect order data
- add new order status
- optionally add tracking number

## 19.4 Users admin

Capabilities:

- list users
- see admin flag
- see loyalty points
- toggle admin role

Security rule:

- every admin endpoint must verify admin session server-side;
- never trust a client flag alone.

---

## 20. AI Chat Specification

The AI chat should remain a product feature, not a stub.

Required implementation rules:

- run all Gemini requests server-side;
- store system prompt server-side;
- allow tool invocation only through backend-controlled functions;
- tool outputs must query the real DB;
- preserve the assistant's role as a catalog consultant, not a general chatbot.

Suggested backend tool functions:

- `search_books(query)`
- `get_book_details(bookId or title)`
- `search_authors(query)`
- `get_author_books(authorId or authorName)`

Important UX states to preserve:

- API not configured
- loading
- ready/connected
- typing
- request failed

---

## 21. Media And Static Assets

Current desktop app often resolves local file paths for covers and author images.

For the web rebuild:

- convert local file path assumptions into web-safe URLs;
- store media under `/public` for the initial version, or in object storage;
- normalize image URLs in API responses;
- provide fallback placeholders when images are missing.

Preserve current visual behavior:

- grayscale overlay on book covers in cards by default
- image zoom on hover
- placeholder icons when no image exists

---

## 22. Responsive Behavior To Preserve

Keep the app desktop-first.

Important parity breakpoints from the current app:

- app compact mode around width `< 1100`
- mobile mode around width `< 900`
- cart checkout layout collapses below about `980`
- book details spacing/actions change below about `860` and `680`
- order details panel changes card columns by width

Recommended web behavior:

- desktop >= 1200: very close to current desktop app
- tablet 900-1199: same layout but tighter spacing
- mobile < 900: sidebar becomes off-canvas, grids stack vertically

But still keep the same components and visual identity.

---

## 23. Implementation Phases

To maximize AI implementation success, build in phases.

### Phase 1. Foundation

- initialize Next.js project
- set up TypeScript, Tailwind, Prisma, PostgreSQL connection
- define CSS variables from current theme
- load fonts
- build app shell: sidebar + header + page layout

### Phase 2. Read-only storefront

- home page
- books page
- book cards
- authors page
- author details page
- global search suggestions

### Phase 3. Auth and profile

- credentials login/register
- session handling
- profile page guest state
- profile page logged-in state

### Phase 4. Cart and standard checkout

- cart storage in DB
- cart page
- quantity controls
- checkout form with city/street/house
- direct order creation for non-LiqPay methods

### Phase 5. LiqPay + reservations

- reservation endpoints
- payment transaction endpoints
- LiqPay start/verify/cancel flow
- webhook/callback handling

### Phase 6. Orders and tracking

- orders list
- order details drawer
- tracking summary
- timeline
- status history

### Phase 7. Reviews and AI chat

- comments API
- review submission
- AI widget
- Gemini backend tools

### Phase 8. Admin panel

- books management
- comments moderation
- orders status management
- users/admin-role management

### Phase 9. Polishing and parity pass

- refine spacing, typography, hover states, shadows, borders
- compare every page against desktop app
- fix layout mismatches

---

## 24. Definition Of Done

The website is considered complete only if all of the following are true.

### Visual parity

- dark editorial style matches the Qt app
- sidebar/header structure preserved
- typography preserved
- cards/borders/radii/hover behavior preserved
- AI widget visually matches the app

### Functional parity

- auth works
- search suggestions work
- catalog filters work
- book details and comments work
- authors pages work
- cart works
- checkout works
- LiqPay reservation flow works
- orders and tracking work
- admin features work
- AI chat works with DB-backed tools

### Security

- no DB access from browser
- no payment secret in browser
- no admin action without server auth check
- no Gemini secret exposed in browser if possible

### Data parity

- current PostgreSQL schema concepts preserved
- order/payment/reservation logic preserved

---

## 25. Acceptance Checklist For Another AI

If another AI is implementing this, it should be asked to verify these items before declaring success.

- Are all major routes implemented?
- Is the left sidebar persistent on desktop?
- Does the global search suggest both books and authors?
- Is login/registration embedded inside the profile page?
- Can the user add to cart from catalog, author details, and book details?
- Does checkout require city/street/house?
- Does LiqPay start by reserving stock?
- Does cancellation release reservation?
- Does successful verification create the order and complete the reservation?
- Does orders page open a right-side details drawer?
- Does tracking derive from order statuses?
- Does admin include stock increase and price update?
- Does AI chat use backend tools instead of hallucinating catalog facts?
- Does the website look like the current app rather than a generic template?

---

## 26. Direct Build Prompt For Another AI

Below is a ready-to-use instruction block that can be given to another AI.

```text
Build a full-stack website that recreates the existing Qt/QML desktop bookstore application as closely as possible in both design and functionality.

Tech stack:
- Next.js 14+ App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- Prisma
- PostgreSQL
- React Hook Form + Zod
- TanStack Query
- secure cookie-based auth

Main requirement:
Do NOT redesign the product into a generic web store. Recreate the current desktop app's structure, styling, components, and flows as closely as possible.

Design rules:
- Background almost black (#030303)
- Typography: Playfair Display for headings, Inter for body
- Persistent left sidebar on desktop
- Minimal header with giant serif page title and underlined search
- Subtle glass panels, white translucent borders, restrained grayscale palette
- Do not introduce bright random accent colors or generic dashboard styles

Required pages:
- /
- /books
- /books/[bookId]
- /authors
- /authors/[authorId]
- /cart
- /orders
- /profile
- /admin

Required features:
- auth on profile page (login/register inline)
- global search suggestions for books/authors
- catalog with filters
- book details with comments and similar books
- author details with books by author
- cart with qty controls
- checkout with city/street/house fields
- payment methods: cash, card, LiqPay Sandbox
- LiqPay reservation flow that holds stock before payment completion
- orders page with right-side details drawer
- tracking timeline derived from order statuses
- admin books/comments/orders/users management
- floating AI assistant widget with Gemini server-side integration and DB-backed tools

Critical logic:
- browser must never connect directly to PostgreSQL
- payment signing secrets must stay on server
- reservation must decrease available stock during LiqPay flow and restore it on cancel/failure/expiry
- successful LiqPay verification must create the order and complete the reservation

Preserve UI language in Ukrainian.

Use the following existing source files as the product reference:
- qml/main.qml
- qml/pages/*.qml
- qml/components/*.qml
- qml_models/*.h
- qml_models/theme.h
- core/database.h
- sql/schema.sql

Implement in phases:
1. app shell and theme
2. read-only pages
3. auth/profile
4. cart/standard checkout
5. LiqPay + reservation
6. orders/tracking
7. AI chat
8. admin
9. parity polish

Return code that is production-structured, not just a demo.
```

---

## 27. Final Recommendation

If this document is used as input for another AI, also provide:

- the repo itself;
- screenshots of the most important pages;
- the current DB schema;
- any brand/icon/image assets;
- a short note: `Do not simplify or redesign. Rebuild the existing app as a website with parity.`

That combination will greatly increase the chances of getting a correct result.
