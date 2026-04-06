# EAA 690 Website

Modern rebuild of the [EAA Chapter 690](https://www.eaa690.org/) website.
Live preview: **[eaa-960-redesign.vercel.app](https://eaa-960-redesign.vercel.app)**

## Tech Stack

| | |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Auth** | BetterAuth (email/password, 2FA, admin roles) |
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
| `NODE_TLS_REJECT_UNAUTHORIZED` | Set to `0` for Supabase SSL compatibility |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project ID (when CMS is configured) |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` |

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
  calendar/           # Events
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
  site-url.ts         # Canonical URL helper
  sanity.ts           # Sanity client
sanity/schemas/       # CMS content types (events, news, board, etc.)
scripts/              # One-off admin/DB scripts
```

## Authentication

BetterAuth handles email/password login, 2FA, and admin roles.

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
npm run build    # Production build
npm run lint     # ESLint
npx tsx scripts/create-admin.ts email password "Name"  # Create admin via CLI
```
