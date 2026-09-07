# Shared packages guide

This file applies to `packages`.

## Package roles

- `models`: shared structural types, evaluation results, snowflakes, and permission enums/maps. Its
  `src/index.ts` is the public barrel consumed directly as TypeScript by workspace apps.
- `utils`: environment-neutral helpers used by backend/frontend. Tests live next to source as
  `*.spec.ts` and run with Jest/ts-jest and coverage.
- `scripts`: maintenance CLIs. `dependency-check.ts` verifies that the same dependency has the same
  version everywhere in the workspace.

Keep packages free of application-specific runtime dependencies unless the package's role truly
requires them. Export new public modules from the package's `src/index.ts`.

## Model evolution

`Snowflake` is `bigint`. Models often preserve schema history as `ThingV1`, `ThingV2`, and so on,
with `Thing` aliasing the current version. When changing persisted data:

1. Add the next version instead of rewriting what an old migration means.
2. Advance the public alias.
3. Add/register a backend migration and update database writes/reads.
4. Update frontend/API consumers and serialization assumptions.

Permission enum numeric positions are persisted bit positions. Append new permissions; do not
reorder or renumber existing enum members. Update the organisation-to-admin and
contest-to-organisation maps whenever a permission is added.

## Utilities, dependencies, and checks

Add focused `*.spec.ts` coverage for utility behavior, including invalid and boundary inputs. Keep
utilities portable: `@kontestis/utils` is consumed in both Node and the browser.

Workspace dependency versions are intentionally exact-consistent across `dependencies` and
`devDependencies`. After editing any package manifest, run the checker as well as `pnpm install` so
the lockfile stays synchronized.

```sh
pnpm --filter @kontestis/utils test
pnpm --filter @kontestis/scripts typecheck
pnpm --filter=@kontestis/scripts exec-script dependency-check
pnpm typecheck
pnpm lint
```

`packages/models` has no package-local typecheck script, so its types are checked through consuming
applications. Run the root typecheck for model changes.
