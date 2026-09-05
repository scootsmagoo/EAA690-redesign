# EAA 690 Website

Modern rebuild of the [EAA Chapter 690](https://www.eaa690.org/) website.
Live preview: **[eaa-960-redesign.vercel.app](https://eaa-960-redesign.vercel.app)**

## Tech Stack

| | |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Auth** | BetterAuth (email/password, admin roles) |
| **Database** | PostgreSQL via Supabase |
| **CMS** | Sanity (schemas in `sanity/schemas/`) |
| **Deployment** | Vercel |

## Local Development

```bash
npm install
npm run dev
# → http://localhost:3000
```

No database required locally — the app falls back to a local SQLite file (`eaa-auth.db`) automatically.

## Environment Variables

For production (Vercel → Settings → Environment Variables):

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase transaction pooler connection string |
| `BETTER_AUTH_SECRET` | Random secret ≥ 32 chars (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Your deployed URL (e.g. `https://eaa-960-redesign.vercel.app`) |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Same as above |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project ID (when CMS is configured) |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` |
| `NEXT_PUBLIC_GOOGLE_CALENDAR_ID` | Chapter Google Calendar ID (e.g. `eaa690@gmail.com`). When set, `/calendar` embeds it read-only; when unset, the page shows a CMS/sample fallback with a "Preview mode" banner |
| `NEXT_PUBLIC_GOOGLE_CALENDAR_TIMEZONE` | `America/New_York` |

> **Do not set `NODE_TLS_REJECT_UNAUTHORIZED=0`.** It disables certificate verification for every outbound
> connection in the process (Stripe, Resend, Sanity, Google). The Postgres pool already relaxes verification
> for itself in `lib/pg-pool.ts`, which is the only place it is needed.

**Supabase connection string format** (use Transaction pooler, not Direct):
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

## Project Structure

```
app/                  # Pages (Next.js App Router)
  donate/             # Donation page
  join/               # Membership tiers
  chapter/            # Chapter info subpages
  programs/           # Programs subpages
  store/              # Store
  calendar/           # Public events (read-only Google Calendar embed)
  admin/calendar/     # Google Calendar setup (admin only)
  news/ kudos/ media/ # Content pages
  sign-in/ signup/    # Auth pages
  members/            # Protected member area
  admin/              # Admin dashboard
components/
  Navigation.tsx      # Main nav with dropdowns
  Footer.tsx
  AuthGuard.tsx       # Wraps protected pages
  AdminGuard.tsx      # Wraps admin-only pages
  CookieBanner.tsx    # Cookie consent (persisted to localStorage)
lib/
  better-auth.ts      # Auth config (Postgres + SQLite fallback)
  db-resolver.ts      # Picks DATABASE_URL → POSTGRES_URL → SQLite
  pg-pool.ts          # Shared Postgres pool (never create ad-hoc pg.Pool instances)
  site-url.ts         # Canonical URL helper
  sanity.ts           # Sanity client
sanity/schemas/       # CMS content types (events, news, board, etc.)
scripts/              # migrate.ts (runs before every build) + one-off admin/DB scripts
tests/                # Vitest unit tests for pure lib/ logic
.github/workflows/    # CI (lint/typecheck/test/build) + 15-minute uptime probe
```

## Authentication

BetterAuth handles email/password login and admin roles.

- **First-time setup:** visit `/admin/setup` to create the first admin account
- **Protected pages:** wrap with `<AuthGuard>` or `<AdminGuard>`
- **Debug endpoint:** `/api/auth/debug` — shows env var status and URL config

## Brand Colors

Defined in `tailwind.config.ts`:

```
eaa-blue:       #003366
eaa-yellow:     #FFD700
eaa-light-blue: #0066CC
```

## Sanity CMS

Content schemas are ready in `sanity/schemas/` but the CMS isn't connected yet. See `SANITY_SETUP.md` for setup instructions.

## Scripts

```bash
npm run dev      # Dev server (port 3000)
npm run build    # Runs DB migrations (if DATABASE_URL is Postgres) then `next build`
npm run migrate  # Apply Better Auth schema migrations + column backfills on their own
npm run lint     # ESLint (errors fail CI; the set-state-in-effect rule is a warning)
npm run typecheck
npm test         # Vitest unit tests in tests/
npx tsx scripts/create-admin.ts email password "Name"  # Create admin via CLI
```

## Health, monitoring, CI

- **`GET /api/health`** — unauthenticated liveness probe (database `SELECT 1` + auth config). Returns
  `{ ok, checks }` with 200 or 503 and no connection details. Point any uptime monitor at it.
- **Uptime workflow** (`.github/workflows/uptime.yml`) hits `/api/health`, `/sign-in`, and `/` every
  15 minutes; a failed run emails the repo owner. Set a repository variable `SITE_URL` to retarget it
  when the custom domain goes live.
- **CI** (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests, and a production build on every
  push to `main` and every pull request.
- **Migrations run at build time.** `npm run build` applies Better Auth schema migrations before
  `next build`, so a migration that cannot apply fails the deploy instead of failing users on first login
  (this is exactly what happened with the better-auth 1.6 → 1.7 upgrade). The lazy runtime path still
  exists as a fallback for local SQLite.
- **Dependabot** groups minor/patch bumps into one weekly PR. `better-auth` only receives patch bumps
  automatically — read its upgrade guide before taking a minor or major.

## Dependency hygiene

- **Next.js:** stay on the latest **16.x** release line (security fixes landed in **16.2.5+**; see [Next.js / RSC advisories, May 2026](https://cyberpress.org/vulnerabilities-patched-in-next-js-and-react/)). After `git pull`, run `npm install` so `package-lock.json` matches.
- **`npm audit`:** useful signal; some items are transitive (e.g. Sanity tooling, PostCSS bundled with Next) and clear only when upstream packages ship updates—avoid `npm audit fix --force` unless you intend major downgrades.
- **Stripe:** the server SDK **`apiVersion`** is pinned in `lib/stripe.ts`. When you upgrade the `stripe` package, TypeScript will expect the new literal—keep it aligned with your [Stripe API version](https://stripe.com/docs/api/versioning) / Dashboard default.
