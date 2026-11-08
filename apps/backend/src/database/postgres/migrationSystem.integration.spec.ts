/* eslint-env jest */

import { Globals } from "../../globals";
import { Database } from "../Database";
import { migrationInitial } from "./migrations/0001_initial";
import { definePostgresMigration, PostgresMigration } from "./migrations/types";
import { PostgresDatabase } from "./PostgresDatabase";
import { runPostgresMigrations } from "./runMigrations";

const databaseName = `kontestis_migration_test_${process.pid}`;
const testDatabaseUrl = (() => {
    const url = new URL(Globals.postgresUrl);

    url.pathname = `/${databaseName}`;

    return url.toString();
})();

const migration2 = definePostgresMigration({
    version: 2,
    name: "typed_data_migration",
    checksum: "typed-data-migration-v1",
    up: async ({ client, database, log }) => {
        await database.insertInto(
            "users",
            {
                id: 1n,
                email: "migration@example.com",
                full_name: "Migration Test",
                permissions: 0n,
                picture_url: "",
            },
            client
        );
        log("Inserted typed fixture");
    },
});

const failingMigration3 = definePostgresMigration({
    version: 3,
    name: "transaction_rollback",
    checksum: "transaction-rollback-v1",
    up: async ({ client }) => {
        await client.query("CREATE TABLE should_be_rolled_back(id integer PRIMARY KEY)");
        throw new Error("intentional migration failure");
    },
});

const successfulMigration3 = definePostgresMigration({
    ...failingMigration3,
    up: async ({ client }) => {
        await client.query("CREATE TABLE committed_migration(id integer PRIMARY KEY)");
    },
});

describe("PostgreSQL migration runner", () => {
    let testDatabase: PostgresDatabase;

    beforeAll(async () => {
        await Database.raw(`CREATE DATABASE "${databaseName}"`);
        testDatabase = new PostgresDatabase(testDatabaseUrl);
    });

    afterAll(async () => {
        await testDatabase.shutdown();
        await Database.raw(`DROP DATABASE "${databaseName}" WITH (FORCE)`);
        await Database.shutdown();
    });

    it("applies ordered schema and typed data migrations and is idempotent", async () => {
        const migrations = [migrationInitial, migration2] as const;

        await runPostgresMigrations(testDatabase, migrations);
        const first = await testDatabase.raw<{
            version: number;
            name: string;
            checksum: string;
            applied_at: Date;
        }>("SELECT version, name, checksum, applied_at FROM schema_migrations ORDER BY version");

        await runPostgresMigrations(testDatabase, migrations);
        const second = await testDatabase.raw<{ version: number; applied_at: Date }>(
            "SELECT version, applied_at FROM schema_migrations ORDER BY version"
        );
        const user = await testDatabase.selectOneFrom("users", "*", { id: 1n });

        expect(first.rows.map(({ version, name }) => ({ version, name }))).toEqual([
            { version: 1, name: "initial" },
            { version: 2, name: "typed_data_migration" },
        ]);
        expect(second.rows.map((row) => row.applied_at)).toEqual(
            first.rows.map((row) => row.applied_at)
        );
        expect(user?.email).toBe("migration@example.com");
    });

    it("rolls a failed migration back and can retry it", async () => {
        const failing = [migrationInitial, migration2, failingMigration3] as const;

        await expect(runPostgresMigrations(testDatabase, failing)).rejects.toThrow(
            "intentional migration failure"
        );

        const rolledBackTable = await testDatabase.raw<{ table_name: string | null }>(
            "SELECT to_regclass('public.should_be_rolled_back') AS table_name"
        );
        const failedMarker = await testDatabase.raw<{ count: bigint }>(
            "SELECT COUNT(*)::bigint AS count FROM schema_migrations"
        );

        expect(rolledBackTable.rows[0].table_name).toBeNull();
        expect(failedMarker.rows[0].count).toBe(2n);

        await runPostgresMigrations(testDatabase, [
            migrationInitial,
            migration2,
            successfulMigration3,
        ]);

        const committedTable = await testDatabase.raw<{ table_name: string | null }>(
            "SELECT to_regclass('public.committed_migration') AS table_name"
        );

        expect(committedTable.rows[0].table_name).toBe("committed_migration");
    });

    it("fails closed for gaps and changed applied checksums", async () => {
        const gap = definePostgresMigration({
            version: 4,
            name: "gap",
            checksum: "gap-v1",
            up: async () => {},
        });

        await expect(
            runPostgresMigrations(testDatabase, [migrationInitial, migration2, gap])
        ).rejects.toThrow("manifest has a gap");

        const changedMigration2: PostgresMigration = {
            ...migration2,
            checksum: "changed-checksum",
        };

        await expect(
            runPostgresMigrations(testDatabase, [
                migrationInitial,
                changedMigration2,
                successfulMigration3,
            ])
        ).rejects.toThrow("differs from the applied migration");
    });
});
