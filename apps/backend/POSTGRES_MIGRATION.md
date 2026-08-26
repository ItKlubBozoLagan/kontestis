# ScyllaDB to PostgreSQL migration

The backend reads and writes PostgreSQL after this change. ScyllaDB is used only as the source of the one-time migration.

## PostgreSQL schema migrations

PostgreSQL schema migrations run automatically during backend startup, before the one-time ScyllaDB data copy. They are forward-only, ordered, individually transactional, and serialized with a PostgreSQL advisory lock. Startup fails if a version is missing, the database contains a newer unknown version, or an applied name/checksum differs from the application manifest.

Create a migration from `apps/backend`:

```sh
pnpm create-postgres-migration add_example_column
```

The command creates the next numbered SQL migration. Export it from `src/database/postgres/migrations/index.ts` in version order. `defineSqlMigration` calculates its checksum from the SQL. Applied migration files are immutable; make a new migration instead of editing one.

For a data migration, use `definePostgresMigration`. Its callback receives the transaction-bound `PoolClient`, the typed PostgreSQL database adapter, and a migration logger. Supply a stable checksum and change it whenever the unapplied migration body changes:

```ts
export const migration0002 = definePostgresMigration({
    version: 2,
    name: "normalize_example",
    checksum: "normalize-example-v1",
    up: async ({ client, database, log }) => {
        const users = await database.selectFrom("users", ["id"], {}, client);
        // Perform typed reads/writes or arbitrary PostgreSQL SQL inside this transaction.
        log(`Migrated ${users.length} users`);
    },
});
```

The `schema_migrations` table records version, name, checksum, and application time. Databases created by the first PostgreSQL cutover used a version-only row; the runner safely adopts that version-1 marker without replaying the initial schema.

## Preconditions

- Take and verify a recoverable ScyllaDB backup.
- Put the backend in maintenance mode so the source cannot change during the copy.
- Configure `DATABASE_URL` for an empty PostgreSQL 16 database.
- Keep `SCYLLA_MIGRATION_ENABLED=true` for the first startup only.
- Configure the existing `DB_HOST`, `DB_PORT`, `DB_KEYSPACE`, and `DB_DATACENTER` values so the migrator can reach ScyllaDB.

The migrator opens the existing ScyllaDB keyspace, runs every legacy Scyllo migration through `0054_add_temporary_users`, and requires Scyllo's zero-based schema marker to equal `53` before it copies any business data. A source schema newer than the version understood by this release fails closed.

## Run the migration

Start the backend normally or run the migration without starting HTTP:

```sh
pnpm --filter @kontestis/backend migrate:postgres
```

The migration:

1. takes a PostgreSQL advisory lock;
2. upgrades and validates the ScyllaDB schema;
3. copies all 22 business tables in resumable pages;
4. writes each page and its checkpoint in one PostgreSQL transaction;
5. verifies every table with an exact row count and order-independent SHA-256 row digest;
6. audits duplicate natural identities and legacy orphan references;
7. marks the migration complete only after every verification succeeds.

If the process stops, rerun the same command. Completed tables are skipped and an incomplete table resumes from its last committed ScyllaDB page state. Once the global marker is complete, subsequent runs are no-ops.

## Verify and cut over

The production-snapshot integration suite checks the completion marker, all table counts and digests, normalized tags and score maps, and composite identities:

```sh
TEST_PRODUCTION_SNAPSHOT=true pnpm --filter @kontestis/backend test
```

Useful audit queries:

```sql
SELECT status, source_schema_version, started_at, completed_at, error
FROM scylla_migration WHERE migration_key = 1;

SELECT table_name, status, source_rows, target_rows,
       source_digest = target_digest AS digest_matches, error
FROM scylla_migration_tables ORDER BY table_name;

SELECT check_name, violation_count
FROM scylla_migration_integrity ORDER BY check_name;
```

Keep maintenance mode enabled if any table is incomplete, any count or digest differs, or the migration command exits nonzero. After successful verification, restart the backend with PostgreSQL as its database. `SCYLLA_MIGRATION_ENABLED` can then be set to `false`; a PostgreSQL database without the completion marker will refuse to start.

Do not remove the ScyllaDB backup until the PostgreSQL retention period and application smoke tests have passed. Rollback before new PostgreSQL writes consists of stopping the backend and restoring the backed-up ScyllaDB deployment with the previous application release.

## Normalized data

ScyllaDB's `problems.tags` set is stored in `problem_tags`. The `contest_members.score` and `contest_members.exam_score` maps are stored in `contest_member_scores` and `contest_member_exam_scores`. Repository reads reconstruct the existing API model, while a single score entry is updated atomically with `INSERT ... ON CONFLICT DO UPDATE`.

The restored production snapshot contains a small number of legacy orphan rows and duplicate natural member identities. They are preserved and reported by the integrity audit. Core foreign keys that would reject those rows are intentionally deferred; the new normalized child tables are constrained to their composite parent identity.
