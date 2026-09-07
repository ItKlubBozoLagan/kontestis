# Frontend guide

This file applies to `apps/frontend`.

## Runtime map

- `src/index.tsx` installs React Query, language context, and the browser router.
- `src/App.tsx` restores authentication and organisation state, clears queries when the selected
  organisation changes, and chooses one of the route trees in `src/routers`.
- `src/pages` owns route-level UI; `src/components` contains reusable UI.
- `src/hooks` is the API/data-access layer, mostly React Query v3 query and mutation hooks.
- `src/state` contains Zustand stores. Token, organisation, and language state are persisted.
- `src/api/http.ts` owns the Axios instance, API envelope/SuperJSON decoding, auth and organisation
  headers, processing state, and global error/logout behavior.
- `src/i18n` contains the typed translation system. `src/util` contains frontend-only helpers.

The route tree depends on session state: logged-out, normal logged-in, and temporary users receive
different route sets. A normal user must also select an organisation before dashboard routes mount.

## Data access and state

- Put backend calls in a hook under `src/hooks`, not directly in page components, unless extending
  an established exception.
- Use the shared `http` instance and `wrapAxios`; raw Axios responses still contain the API envelope.
- Query keys are semantic arrays and include every identity/scope that affects returned data. Match
  neighboring hooks exactly so mutation invalidation reaches the intended cached queries.
- Use `QueryHandler` and `MutationHandler` where their signatures fit. Compose mutation options with
  `invalidateOnSuccess` so caller callbacks are retained.
- Snowflake route parameters and model IDs are `bigint`. Interpolate them directly or convert with
  `.toString()`; never pass them through `number`.
- The selected organisation is sent automatically as `X-Kontestis-Org-Id`. `App.tsx` clears the
  entire React Query cache when it changes; do not duplicate organisation header logic in hooks.
- Use Zustand for cross-route client state and local React state for component-only concerns.

## UI and translations

This frontend uses twin.macro + styled-components with Tailwind utilities, plus SCSS for global and
problem-markdown styling. Follow the style of the component being changed; `tw`/`css` composition is
common and requires the Babel plugins configured in `vite.config.ts`.

English is the type-defining default language. Add a key to `src/i18n/languages/en.ts` first, then
add the Croatian value in `hr.ts`. Missing non-English keys fall back to English, but leaving a new
key untranslated should be deliberate. Consume plain keys with `useTranslation`; use the
`Translated` component for strings containing `%1`, `%2`, etc. Placeholders currently support only
single-digit indexes.

When adding a page, update the appropriate route tree and consider all relevant auth modes. Reuse
permission-aware components (`CanAdmin`, `CanContestMember`) where they match, but do not treat UI
hiding as backend authorization.

## Configuration and verification

Vite variables are documented in `.env.example`. Only `VITE_*` values are exposed to browser code;
never place secrets there. The default API endpoint is `http://localhost:8080`, and `http.ts`
automatically appends `/api`.

Run:

```sh
pnpm --filter @kontestis/frontend typecheck
pnpm --filter @kontestis/frontend build
pnpm lint
```

There is no frontend test suite. Manually verify loading, empty, error, and mutation-success states,
plus navigation and query refresh behavior. For organisation-scoped work, switch organisations and
confirm stale data is not retained. For translated UI, check both English and Croatian.
