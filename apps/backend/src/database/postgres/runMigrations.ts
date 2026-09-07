import { PoolClient } from "pg";

import { Logger } from "../../lib/logger";
import { postgresMigrations } from "./migrations";
import { PostgresMigration } from "./migrations/types";
import { PostgresDatabase } from "./PostgresDatabase";

const POSTGRES_MIGRATION_LOCK_ID = 4_936_759_211;

type AppliedMigration = {
    version: number;
    name: string | null;
    checksum: string | null;
};

const validateManifest = (migrations: readonly PostgresMigration[]): void => {
    const identities = new Set<string>();

    for (const [index, migration] of migrations.entries()) {
        const expectedVersion = index + 1;

        if (migration.version !== expectedVersion) {
            throw new Error(
                `PostgreSQL migration manifest has a gap: expected version ${expectedVersion}, found ${migration.version}`
            );
        }

        if (!migration.name || !migration.checksum) {
            throw new Error(`PostgreSQL migration ${migration.version} has no name or checksum`);
        }

        const identity = `${migration.version}:${migration.name}`;

        if (identities.has(identity)) {
            throw new Error(`Duplicate PostgreSQL migration identity: ${identity}`);
        }

        identities.add(identity);
    }
};

const bootstrapMigrationTable = async (client: PoolClient): Promise<void> => {
    await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version integer PRIMARY KEY,
            name text,
            checksum text,
            applied_at timestamptz NOT NULL DEFAULT now()
        );
        ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS name text;
        ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS checksum text;
    `);
};

const validateAndAdoptAppliedMigrations = async (
    client: PoolClient,
    migrations: readonly PostgresMigration[]
): Promise<Set<number>> => {
    const result = await client.query<AppliedMigration>(
        "SELECT version, name, checksum FROM schema_migrations ORDER BY version"
    );
    const manifest = new Map(migrations.map((migration) => [migration.version, migration]));
    const applied = new Set<number>();

    for (const row of result.rows) {
        const migration = manifest.get(row.version);

        if (!migration) {
            throw new Error(
                `Database has unknown PostgreSQL migration version ${row.version}; this application cannot safely start`
            );
        }

        // Version 1 predates names/checksums in this branch. Adopt it without replaying the schema.
        if (row.version === 1 && row.name === null && row.checksum === null) {
            await client.query(
                "UPDATE schema_migrations SET name=$2, checksum=$3 WHERE version=$1",
                [migration.version, migration.name, migration.checksum]
            );
        } else if (row.name !== migration.name || row.checksum !== migration.checksum) {
            throw new Error(
                `PostgreSQL migration ${row.version} differs from the applied migration (${
                    row.name ?? "missing name"
                })`
            );
        }

        applied.add(row.version);
    }

    return applied;
};

const applyMigration = async (
    client: PoolClient,
    database: PostgresDatabase,
    migration: PostgresMigration
): Promise<void> => {
    await client.query("BEGIN");

    try {
        await migration.up({
            client,
            database,
            log: (message) =>
                Logger.database(`PostgreSQL migration ${migration.version}: ${message}`),
        });
        await client.query(
            "INSERT INTO schema_migrations(version, name, checksum) VALUES ($1, $2, $3)",
            [migration.version, migration.name, migration.checksum]
        );
        await client.query("COMMIT");
        Logger.database(`Applied PostgreSQL migration ${migration.version}: ${migration.name}`);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
};

export const runPostgresMigrations = async (
    database: PostgresDatabase,
    migrations: readonly PostgresMigration[] = postgresMigrations
): Promise<void> => {
    validateManifest(migrations);

    const client = await database.pool.connect();

    await client.query("SELECT pg_advisory_lock($1)", [POSTGRES_MIGRATION_LOCK_ID]);

    try {
        await bootstrapMigrationTable(client);

        const applied = await validateAndAdoptAppliedMigrations(client, migrations);

        for (const migration of migrations) {
            if (!applied.has(migration.version)) await applyMigration(client, database, migration);
        }

        await client.query("ALTER TABLE schema_migrations ALTER COLUMN name SET NOT NULL");
        await client.query("ALTER TABLE schema_migrations ALTER COLUMN checksum SET NOT NULL");
    } finally {
        await client.query("SELECT pg_advisory_unlock($1)", [POSTGRES_MIGRATION_LOCK_ID]);
        client.release();
    }
};
