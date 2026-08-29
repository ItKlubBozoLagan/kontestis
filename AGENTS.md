# Kontestis contributor guide

This file applies to the whole repository. More specific guidance lives in:

- `apps/backend/AGENTS.md`
- `apps/frontend/AGENTS.md`
- `apps/function/AGENTS.md`
- `packages/AGENTS.md`

Read the relevant scoped file before changing that part of the tree.

## What this repository is

Kontestis is a programming-contest and exam platform. It is a pnpm TypeScript monorepo with:

- `apps/frontend`: React 18 + Vite 4 single-page application.
- `apps/backend`: Express 5 API backed by ScyllaDB, Redis, and S3/MinIO, with Prometheus metrics
  and a private Grafana embedding proxy.
- `apps/function`: legacy HTTP code-evaluation service. The current evaluator path is a separate
  Redis-queue consumer, not this app.
- `packages/models`: shared database/API types and permission definitions.
- `packages/utils`: small shared utilities; this is currently the only package with Jest tests.
- `packages/scripts`: repository maintenance scripts, notably dependency-version checking.
- `docker-compose.yml`: the development stack.
- `tools/`: ignored local volumes and imported runtime data. It is not source code.

The main domain hierarchy is organisation -> contest -> problem -> cluster -> testcase. A
submission produces cluster and testcase submission records. Contest, organisation, and site-wide
permissions are separate bitsets defined in `packages/models/src/permissions`.

## Toolchain and setup

- Use Node `18.12.1` (see `.nvmrc`).
- Use pnpm only. The repository pins pnpm 9.10.0 in `package.json`; `npm` and `yarn` installs are
  intentionally rejected by `preinstall`.
- Install from the repository root with `pnpm install` so workspace packages are linked correctly.
- For the Docker development stack, copy `global.env.example` to the ignored `global.env` and set
  at least `JWT_SECRET`, then run `docker compose up`. Do not commit real environment values.
- Docker Compose exposes frontend `3000`, backend `8080`, legacy evaluator `8081`, Grafana `3001`,
  Prometheus `9090`, Scylla `9042`, Redis `6379`, and MinIO `9000`/`9001`.
- Backend startup expects MinIO buckets named `submission-meta` and `testcases`. A fresh MinIO volume
  must have them created before S3-backed features work.

To run one application without the whole stack, use a workspace filter, for example:

```sh
pnpm --filter @kontestis/frontend dev
pnpm --filter @kontestis/backend dev
pnpm --filter @kontestis/function dev
```

The backend still needs its external services and environment variables. `docker compose up scylla
redis minio` is a convenient way to start only the core storage infrastructure.

## Repository contracts

- Snowflake IDs are `bigint` in TypeScript and decimal strings over HTTP/storage boundaries. Avoid
  converting IDs through `number`.
- Backend JSON responses use a common envelope and serialize `data` with SuperJSON. Frontend calls
  should go through `http` and `wrapAxios` in `apps/frontend/src/api/http.ts`.
- Authenticated requests use `Authorization: Bearer ...`. Organisation-scoped frontend requests
  also send `X-Kontestis-Org-Id`; the backend defaults a missing/invalid header to organisation `1`.
- Shared API/database shapes belong in `@kontestis/models`. When a persistent shape changes, update
  the model, backend migration/schema use, and frontend consumer together.
- Source is formatted with 4 spaces, double quotes, and a 100-column target. Let the existing ESLint
  and Prettier rules settle import ordering and style.
- Keep dependency versions aligned across workspaces. The pre-commit check rejects mismatches.

## Validation

Run the narrowest relevant command while iterating, then the root checks before handing off a
cross-cutting change:

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm --filter=@kontestis/scripts exec-script dependency-check
```

Useful package-specific checks:

```sh
pnpm --filter @kontestis/backend typecheck
pnpm --filter @kontestis/backend test
pnpm --filter @kontestis/frontend typecheck
pnpm --filter @kontestis/frontend build
pnpm --filter @kontestis/function typecheck
pnpm --filter @kontestis/utils test
```

`packages/utils` owns the broad Jest suite, while the backend has focused Vitest coverage for pure
logic. Service-backed backend flows, frontend behavior, and evaluator changes still need focused
manual verification in addition to typecheck/lint.

## Change discipline

- Search before inventing a new pattern: routes, extractors, query hooks, permissions, and model
  versioning all have established local conventions.
- Do not edit old database migrations after they may have shipped. Add and register a new migration.
- Do not edit or delete `tools/**` as part of source work. It may contain large, user-owned Scylla,
  MinIO, or Influx development data even though Git ignores it.
- Do not read or print `global.env` or app-local `.env` files in logs; use the tracked examples to
  understand configuration.
- `apps/frontend-v2` is ignored local material and has no tracked source. Do not treat it as a
  workspace app or modify it unless a task explicitly puts it in scope.
- Generated `coverage/` and `tsconfig.tsbuildinfo` files are ignored and should not be committed.
- Preserve backwards-compatibility decisions marked `legacy_*`; the old HTTP evaluator and current
  Redis evaluator have different payloads and execution paths.
