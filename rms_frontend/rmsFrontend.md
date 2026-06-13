# RMS Frontend — context for Claude / AI assistants

This document summarizes the **Retail Management System (RMS)** Next.js app under `rms_frontend/`. Use it to navigate the codebase, follow existing patterns, and avoid breaking auth or API contracts.

---

## Role of this app

Browser UI for store operations: **dashboard**, **POS**, **sales**, **customers**, **inventory**, **preorders / online preorders**, **expenses**, **reports**, **staff**, **tasks**, and **ecommerce storefront settings** (home page, hero, discounts, delivery, promotional modals, product visibility, etc.). It talks to a **Django-style REST API** (JWT access token in a cookie).

---

## Stack

| Area | Choice |
|------|--------|
| Framework | **Next.js 15** (App Router), **React 19** |
| Language | **TypeScript** (`strict: true`; build may still pass with `ignoreBuildErrors` in `next.config.mjs`) |
| Styling | **Tailwind CSS** + **CSS variables** (shadcn “neutral” theme) — primary entry: `app/globals.css` |
| UI primitives | **shadcn/ui** (Radix primitives, `class-variance-authority`, `tailwind-merge`) — `components/ui/*` |
| Icons | **lucide-react** |
| HTTP | **axios** (two patterns: bare `axios` vs configured instance — see API section) |
| Server state | **TanStack React Query v5** (`@tanstack/react-query`) |
| Client state | **Zustand** (notably POS: `store/pos-store.ts`) |
| Forms | **react-hook-form** + **zod** + **@hookform/resolvers** |
| Charts / calendar | **recharts**, **FullCalendar**, **react-calendar** / **react-day-picker** |
| PDF / export | **jspdf**, **jspdf-autotable**, **file-saver** |
| Drag-and-drop (tasks) | **@dnd-kit** |

---

## Commands

- **Dev:** `npm run dev` — uses **Turbopack** (`next dev --turbopack`). Package manager lockfiles include both `package-lock.json` and `pnpm-lock.yaml`; pick one workflow and stick to it locally.
- **Build / prod:** `npm run build`, `npm run start`
- **Lint:** `npm run lint`  
  Note: `next.config.mjs` sets `eslint.ignoreDuringBuilds: true` and `typescript.ignoreBuildErrors: true`, so CI/local `next build` may not surface all issues.

---

## Environment

- **`NEXT_PUBLIC_API_URL`** — API base URL, including `/api`. It must be set before a production build. `NEXT_PUBLIC_BASEURL` remains supported as a legacy alias; development defaults to `http://localhost:8000/api`.
- **Branch scoping header** — branch-scoped API calls now send `X-Branch-Id` from `localStorage.selectedBranchId` in `lib/api/axios-config.ts`. Admin aggregate endpoints may omit this header.

---

## App Router layout (important)

- **`app/layout.tsx`** — Root layout: `Inter` font, `./globals.css`, wraps children with **`Providers`** (React Query) and **`AuthProvider`**, plus **`Toaster`**.
- **`app/(main)/layout.tsx`** — **Client** shell for authenticated app pages: **`SideNav`**, **`UpperNav`**, **`ThemeProvider`**, **`TaskProvider`**, **`BismillahProvider`**, **`BismillahLogo`**, main content area, duplicate **`AuthProvider`** + **`Toaster`** in this tree.
- **`app/(auth)/layout.tsx`** — Login route group: lighter chrome (theme + main wrapper); metadata mentions “MenWear Pro”.

**Route groups:**

- **`(main)/`** — Most feature pages (dashboard `/`, POS, sales, inventory, etc.). See `components/side-nav.tsx` `mainNavItems` for the canonical menu map and hrefs.
- **`(auth)/login/`** — Login page.

**Middleware:** `middleware.ts` only matches `/about/:path*` and redirects to `/home` — it does **not** protect RMS routes; **client-side auth** in `contexts/auth-context.tsx` drives redirects to `/login`.

---

## Authentication

- **Token:** JWT **access** string stored in **`js-cookie`** key **`token`** (7-day expiry on login; `secure` in production, `sameSite: "strict"`).
- **`AuthProvider`** (`contexts/auth-context.tsx`): On load, reads cookie, **`jwt-decode`** to check `exp`, sets **`axios.defaults.headers.common["Authorization"]`**, redirects unauthenticated users away from protected views to **`/login`**. Login calls **`authApi.login`** then `router.push("/")`.
- **`lib/api/auth.ts`:** Uses **plain `axios.post`** to `${API_URL}/auth/login/` (not the shared `axiosInstance`), so keep login URLs aligned with `API_URL`.

---

## API layer

- **`lib/api/axios-config.ts`** — Default **`axiosInstance`**: `baseURL: API_URL`, attaches **`Bearer`** from cookie on each request, response interceptor for error logging.
- **Domain modules** (prefer these for new calls): `inventory.ts`, `sales.ts`, `customer.ts`, `supplier.ts`, `expenses.ts`, `ecommerce.ts`, `preorder.ts`, `onlinePreorder.ts`, `products.ts`, `reports.ts`, `settings.ts`, `auth.ts`.
- **`lib/api/inventory.ts`** is large: CRUD for categories/products/variations/galleries, analytics types, paginated responses; imports DTO/types from **`types/inventory`**.

When adding endpoints: mirror existing module style (named export object or functions, TypeScript interfaces, use `axiosInstance` unless there is a deliberate exception).

---

## Data fetching hooks

- **`hooks/queries/`** — TanStack Query hooks, e.g. `use-dashboard.ts`, `use-sales.ts`, `use-expenses.ts`, `use-preorder.ts`, `use-settings.ts`, `useSuppliers.ts`.
- **Naming note:** There is both **`use-dashbaord.ts`** (typo) and **`use-dashboard.ts`** — grep before importing to use the intended file.

---

## Global / cross-cutting UI

- **`components/side-nav.tsx`** — Primary navigation, collapsibles, mobile sheet, logout via **`useAuth`**, optional branding from **`homePageSettingsApi`**.
- **`components/upper-nav.tsx`**, **`main-nav.tsx`** — Top/header navigation pieces.
- **`components/theme-provider.tsx`** — **`next-themes`**.
- **`context/task-context.tsx`** — Task UI state for `(main)` area.
- **`contexts/bismillah-context.tsx`** + **`components/bismillah-logo.tsx`** — Branding overlay behavior.
- **`components/error-boundary.tsx`**, **`components/hydration-wrapper.tsx`** — Resilience patterns where used.

---

## Major feature folders (`components/`)

| Folder / area | Responsibility |
|---------------|----------------|
| **`pos/`** | POS checkout, cart, receipts, discounts, customer modals — backed by **`store/pos-store.ts`** |
| **`inventory/`** | Product catalog, dialogs (bulk price, images, delete, add stock), analytics widgets |
| **`sales/`** | Sales overview, history tables, summaries |
| **`customers/`** | Customer lists, credit, analysis components |
| **`reports/`** | Sales, P&amp;L, inventory, category, expense, preorder, customer reports |
| **`tasks/`** | Task board, filters, create dialogs, notes |
| **`admin/`** | Branch list/cards and cross-branch financial overview widgets |
| **`hr/`** | Employee table, attendance list, payroll actions |
| **`ecommerce/`** | Promotional modals manager, storefront-related UI |
| **`online-preorders/`** | Verification, manual order form, order detail sheet |
| **`expense/`** | Expense listing UI |
| **`product/`** | Product details / history presentation |

Reusable primitives live under **`components/ui/`** (shadcn-style: `button`, `dialog`, `data-table`, `sidebar`, etc.).

---

## Types

- **`types/inventory.ts`** — Core product/category/gallery models and API DTOs.
- **`types/customer.ts`**, **`types/preorder.ts`**, **`types/sales.ts`** (and others as present) — Align components and API modules.

---

## Path aliases

- **`@/*`** maps to repo root of **`rms_frontend/`** (see `tsconfig.json`). Imports look like `@/components/...`, `@/lib/...`, `@/hooks/...`.

---

## POS state (Zustand)

**`store/pos-store.ts`** — Single store for cart lines, customer search/create, discounts (line + cart), payment method / split pay, receipt modal flags, and sale submission via **`lib/api/sales`** / **`lib/api/customer`**. Use existing actions when changing POS behavior to avoid desynced UI.

---

## Styling and design

- Global tokens and shadcn layers: **`app/globals.css`** (also referenced from some nested layouts).
- Layout background in `(main)`: e.g. `bg-[#F1F5F9]`, sidebar offset `md:ml-[280px]` — keep new pages visually consistent with this shell.
- User preference: **professional UI** — reuse `Card`, `Table`, spacing from existing dashboard/inventory pages.

---

## Oddities / tech debt (useful for maintainers)

1. **Dual React Query setup:** Root `providers.tsx` and **`lib/providers/QueryProvider.tsx`** (with devtools) both exist; root layout uses **`Providers`** from `@/providers`. Know which tree wraps a given page.
2. **`auth.ts`** vs **`axios-config.ts`:** Login uses raw axios; most other modules use **`axiosInstance`**.
3. **Next config:** ESLint/TS errors ignored on build — run **`npm run lint`** and `tsc` manually when hardening.
4. **`middleware.ts`** — Not used for auth gating of the app.
5. **Duplicate `AuthProvider`** in root and `(main)` layout — intentional or historical; changing auth should consider both.

---

## Adding a new screen (checklist)

1. Add **`app/(main)/.../page.tsx`** (and `loading.tsx` if the app uses loading UI elsewhere on that branch).
2. Put reusable UI in **`components/<domain>/`**; keep pages thin.
3. Add API functions in **`lib/api/<domain>.ts`** using **`axiosInstance`**.
4. Add **`hooks/queries/use-<feature>.ts`** if the screen needs cached server state.
5. Register nav in **`components/side-nav.tsx`** if the page should be discoverable in the shell.

---

## File index (quick reference)

```
app/
  layout.tsx              # Root: Query + Auth + Toaster
  globals.css
  (main)/layout.tsx       # App shell: nav, theme, tasks, bismillah
  (main)/**/page.tsx      # Feature routes
  (auth)/login/page.tsx
components/               # Feature + shared UI
components/ui/            # shadcn primitives
context/, contexts/       # React contexts
hooks/, hooks/queries/    # hooks + TanStack Query
lib/api/                  # HTTP + domain APIs
lib/utils.ts              # cn(), formatCurrency, etc.
store/                    # Zustand (POS)
types/                    # Shared TS models
```

This file is **documentation only**; it is not imported by the application.
