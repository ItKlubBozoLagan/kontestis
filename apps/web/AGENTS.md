# Web (modern frontend) guide

This file applies to `apps/web`, the React 19 rewrite of `apps/frontend`. It talks to the same
backend (`apps/backend`) and is not part of `docker-compose.yml`; run it next to the compose stack.

## Toolchain

- Node `>=22.22.0` (React Router 8; Vite 8 also rejects Node 21 and 22.0–22.11). The rest of the monorepo still targets Node 18 via `.nvmrc`.
- `pnpm --filter @kontestis/web dev` serves on <http://localhost:3100>.
- `pnpm --filter @kontestis/web typecheck` and `pnpm --filter @kontestis/web build`.
- Copy `.env.example` to `.env.local` (ignored). Without `VITE_CAPTCHA_SITE_KEY` the captcha is
  skipped, which matches the compose backend (`CAPTCHA_DISABLED=true`). Without
  `VITE_OAUTH_CLIENT_ID` the Google button is hidden.
- This app intentionally uses newer major versions (React 19, TypeScript 5.9, Zod 4, Tailwind 4,
  React Router 8) than the legacy frontend, so it is excluded from the workspace
  dependency-version check (`packages/scripts/src/dependency-check.ts`).
- `tsconfig.json` maps `react`/`react-dom` to this package's `@types` because the hoisted store
  also contains React 18 types for the legacy frontend.

## Stack

| Concern            | Package                                                       |
| ------------------ | ------------------------------------------------------------- |
| UI primitives      | shadcn/ui (Radix) in `src/components/ui` — generated, keep    |
| Styling            | Tailwind CSS 4, tokens in `src/index.css`                      |
| Routing            | React Router (`createBrowserRouter`, route-level `lazy`)      |
| Server state       | TanStack Query 5 (`queryOptions` factories)                    |
| Client state       | Zustand (`src/stores`) — only the token and selected org      |
| Forms              | react-hook-form + zod + shadcn `Form`                          |
| Tables             | TanStack Table via `components/common/DataTable`              |
| i18n               | i18next / react-i18next, typed resources                       |
| Charts             | Recharts through shadcn `chart`                                |
| Markdown           | react-markdown + remark-gfm/math + rehype-katex/highlight      |
| Code editor        | CodeMirror (`components/code/CodeEditor`)                      |
| Toasts             | sonner                                                         |

## Layout

- `src/api/*.ts` is the only place that knows endpoint URLs. Each module exports a
  `<domain>Queries` object of `queryOptions` factories plus `use<Action>` mutation hooks that
  invalidate the right keys. Query keys start with the domain (`["contests", id, ...]`).
- `src/api/http.ts` decodes the SuperJSON envelope (`api.get/post/patch/delete/upload`), attaches
  `Authorization` and `X-Kontestis-Org-Id`, logs out on 401 and toasts on 429/network errors.
- `src/routes/router.tsx` is the route tree; `src/routes/guards.tsx` holds `GuestOnly`,
  `RequireAuth`, `RequireOrganisation` (renders the app shell) and `NotTemporary`.
- `src/features/<area>/` contains pages; page files export a named component matching the
  router's `page(..., "Name")` entry.
- `src/components/common` — page building blocks (`PageHeader`, `Section`, `DataTable`,
  `StatCard`, `EmptyState`, `ConfirmDialog`, `PermissionsDialog`, `Markdown`, `CopyButton`,
  `Alert`, `AsyncBoundary`). `components/badges` — score/verdict/rank/tag badges.
  `components/contest` — contest phase badge and join dialog. `components/code` — editor and
  language lists.
- `src/lib` — pure helpers (`format.ts` for dates/durations in Croatian time, `contest.ts` for
  phases/sorting, `permissions.ts` mirroring backend checks, `rank.ts`).

## Conventions

- Pages read their primary data with `useSuspenseQuery`; the shell wraps every route in
  `AsyncBoundary` (skeleton + error view with retry). Use `useQuery` for optional/secondary data.
- Mutation errors are toasted globally by the `MutationCache`; set `meta: { silent: true }` on
  a mutation that renders its own error. Show success with `toast.success(...)`.
- Snowflakes are `bigint`. Use `.toString()` for URLs and keys, never `Number(id)`.
- The organisation cache is dropped when the selected organisation changes
  (`useOrganisationCacheReset`), so organisation-scoped keys don't need the org id.
- Permission helpers in `lib/permissions.ts` only hide UI; the backend still authorises.
- Every user-visible string goes through `t()`. Each feature owns
  `src/i18n/locales/{en,hr}/<feature>.ts`; English defines the shape, Croatian is typed with
  `Translation<typeof en>`. Shared vocabulary (verdicts, ranks, permissions, phases, languages)
  lives in `shared.ts`.
- Dates in contest context are shown with `formatDateTime` (Europe/Zagreb), relative times with
  date-fns and `useDateLocale()`.
- Formatting: 4 spaces, double quotes, 100 columns (shadcn files in `components/ui` keep their
  generated formatting).
