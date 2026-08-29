# Backend guide

This file applies to `apps/backend`.

## Runtime map

- `src/app.ts` loads environment configuration first, builds the Express app, mounts `/api/*`
  routers plus Prometheus/Grafana surfaces, initializes Scylla/S3, Redis, and AAI@Edu, then starts
  background tasks.
- `src/globals.ts` is the authoritative environment-variable/default map.
- `src/routes` contains domain routers. Nested resources are mounted by their parent handler.
- `src/extractors` loads and memoizes request resources and usually enforces visibility.
- `src/preconditions/hasPermission.ts` contains explicit admin/organisation/contest authorization.
- `src/database/Database.ts` declares the Scyllo table map and the ordered migration list.
- `src/lib` contains domain workflows such as auth, scoring, testcase generation, mail, and
  evaluation. `src/tasks` contains long-running scheduled work.
- `src/s3` and `src/redis` wrap external stores. `src/metrics` owns Prometheus instrumentation,
  while `src/grafana` owns the private iframe proxy.

Top-level routers are mounted as `/api/auth`, `/api/organisation`, `/api/contest`, `/api/problem`,
`/api/submission`, `/api/stats`, and `/api/notifications`.

## Adding or changing an endpoint

Follow the existing route flow:

1. Define a TypeBox schema near the handler and apply `useValidation`. Query validation must pass
   `{ query: true }`; body validation is the default.
2. Resolve route IDs/resources through an extractor rather than repeating lookup logic. Snowflakes
   must remain `bigint`.
3. Use a `mustHave*Permission` precondition, or a modifiable extractor that delegates to one, for
   mutations and private reads. Resource existence and authorization are intentionally sometimes
   collapsed to `404`.
4. Use `SafeError` for expected client failures. Unexpected errors are logged and returned as 500.
5. Return through `respond`/`reject`, never a bespoke JSON envelope. In development `data_raw` is
   added for debugging, but clients must consume the SuperJSON `data` field.

Extractor results are memoized by properties on the Express request. Give parameterized extractors
distinct cache keys as the existing implementations do. Inside `hasPermission.ts`, retain the rule
that only `extractUser` may be called; other extractors can create authorization recursion.

## Database and models

Scylla is accessed through the singleton `Database`. Table types come from `@kontestis/models`.
Prefer typed `selectFrom`, `insertInto`, `update`, and `deleteFrom`; raw CQL is used only where
Scyllo cannot express an operation.

Create a migration from `apps/backend` with:

```sh
pnpm create-migration -- descriptive_name
```

Then import the generated migration in `src/database/Database.ts` and append it to `migrations` in
numeric order. Never reorder, squash, or rewrite an existing migration. A persistent type change
normally adds the next `Vn` type in `packages/models`, advances the public alias, and types the new
migration against the appropriate version.

Migrations run automatically during backend initialization. Treat startup against valuable local
data as a real schema migration, not a harmless smoke test.

## Evaluation and storage

There are two evaluator paths in `src/lib/evaluation.ts`:

- `legacy_evaluation: true` sends an HTTP request through `evaluatorAxios` to `apps/function`.
- Current problems enqueue a payload in Redis via `evaluation_rs.ts` and wait on an
  instance-specific Redis result queue. That consumer is external to this repository.

Do not change one contract assuming it changes the other. Redis queue names come from `Globals` and
`RedisKeys`; the backend subscribes after Redis connects. Testcase inputs/outputs and captured
submission output are stored in S3/MinIO, while Redis also holds pending submissions, generator
state/cache, reevaluation IDs, rate limits, and task locks.

## Configuration and verification

`dotenv` reads `.env` from the backend process working directory. Docker Compose instead injects the
root `global.env` plus service-specific defaults. Use `.env.example`, `global.env.example`, and
`src/globals.ts` as documentation; never expose real secrets.

For backend-only changes run:

```sh
pnpm --filter @kontestis/backend typecheck
pnpm lint
```

The backend has focused Vitest coverage for pure behavior, but service-backed routes still need
manual verification with Scylla/Redis and any relevant S3, Prometheus, Grafana, or evaluator
service running. Remember that the server can log a dependency panic and still reach its final
`Promise.allSettled` startup path, so a listening port alone does not prove all integrations
initialized correctly.
