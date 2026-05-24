# Rgeeb Dashboard — Next.js 15 / App Router

This project has been converted from **TanStack Start + TanStack Router** to **Next.js 15 App Router** with full feature parity.

## What changed

| Concern | Before (TanStack Start) | After (Next.js App Router) |
|---------|------------------------|---------------------------|
| Routing | `createFileRoute` / `routeTree.gen.ts` | App Router `page.tsx` / `layout.tsx` |
| Navigation | `useNavigate` / `<Link to=>` | `useRouter` / `<Link href=>` |
| Active route | `useRouterState` | `usePathname` from `next/navigation` |
| SSR shell | `shellComponent` + `Scripts` | `layout.tsx` with `<html>` |
| Dev server | `vite dev` | `next dev` |
| Build | `vite build` | `next build` |
| Env vars | `import.meta.env.VITE_*` | `process.env.NEXT_PUBLIC_*` |

## What stayed the same

- **All UI components** (`src/components/ui/`) — shadcn/ui, unchanged
- **All services** (`src/services/`) — API calls, unchanged  
- **Auth layer** (`src/lib/auth.tsx`) — token/localStorage logic, unchanged
- **API client** (`src/lib/api.ts`) — only env var prefix changed
- **i18n** (`src/lib/i18n.ts`, locales `en.json` / `ar.json`) — unchanged
- **Theme** (`src/lib/theme.tsx`) — unchanged
- **Endpoints** (`src/lib/endpoints.ts`) — unchanged
- **Styling** (`src/app/globals.css`) — Tailwind v4 CSS, unchanged
- **TanStack Query** — still used for data fetching in all pages

## Route mapping

| TanStack route file | Next.js path |
|--------------------|-------------|
| `_authenticated.dashboard.index.tsx` | `app/dashboard/page.tsx` |
| `_authenticated.dashboard.statistics.tsx` | `app/dashboard/statistics/page.tsx` |
| `_authenticated.dashboard.analytics.tsx` | `app/dashboard/analytics/page.tsx` |
| `_authenticated.dashboard.br-intelligence.tsx` | `app/dashboard/br-intelligence/page.tsx` |
| `_authenticated.dashboard.tasks.tsx` | `app/dashboard/tasks/page.tsx` |
| `_authenticated.dashboard.kanban.tsx` | `app/dashboard/kanban/page.tsx` |
| `_authenticated.dashboard.admin.index.tsx` | `app/dashboard/admin/page.tsx` |
| `login.tsx` | `app/(auth)/login/page.tsx` |
| `register.tsx` | `app/(auth)/register/page.tsx` |
| `forgot-password.tsx` | `app/(auth)/forgot-password/page.tsx` |
| `reset-password.tsx` | `app/(auth)/reset-password/page.tsx` |
| *(all other routes follow the same pattern)* | |

## Auth guard

Authentication is enforced in `src/app/dashboard/layout.tsx`. Any unauthenticated access to `/dashboard/**` redirects to `/login`. The `_authenticated` route wrapper logic is replicated there.

## Getting started

```bash
# Install dependencies
npm install

# Create env file
cp .env.example .env.local
# edit .env.local with your API URL

# Run dev server
npm run dev

# Build for production
npm run build
npm start
```

## Directory structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (fonts, providers)
│   ├── page.tsx                # Root redirect (→ /dashboard or /login)
│   ├── globals.css             # Tailwind v4 + brand tokens (same as before)
│   ├── not-found.tsx           # 404 page
│   ├── global-error.tsx        # Error boundary
│   ├── (auth)/                 # Auth route group (no sidebar)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   └── dashboard/
│       ├── layout.tsx          # Auth guard + sidebar shell
│       ├── page.tsx            # Main dashboard
│       ├── admin/
│       ├── analytics/
│       ├── tasks/
│       └── ...                 # All other pages
├── components/
│   ├── ui/                     # shadcn/ui (unchanged)
│   ├── AppSidebar.tsx          # next/link + usePathname
│   ├── AppHeader.tsx
│   ├── Providers.tsx           # QueryClient + ThemeProvider + AuthProvider + i18n
│   └── ...
├── lib/
│   ├── api.ts                  # NEXT_PUBLIC_API_URL
│   ├── auth.tsx                # AuthContext (unchanged logic)
│   ├── theme.tsx               # ThemeContext (unchanged)
│   ├── i18n.ts                 # i18next setup (unchanged)
│   └── endpoints.ts            # API endpoints (unchanged)
├── services/                   # All service files (unchanged)
├── hooks/                      # use-mobile.tsx (unchanged)
└── i18n/locales/               # en.json + ar.json (unchanged)
```
