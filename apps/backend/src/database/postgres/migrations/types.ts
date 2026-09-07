import { createHash } from "node:crypto";

import { PoolClient } from "pg";

import { PostgresDatabase } from "../PostgresDatabase";

export type PostgresMigrationContext = {
    client: PoolClient;
    database: PostgresDatabase;
    log: (message: string) => void;
};

export type PostgresMigration = {
    version: number;
    name: string;
    checksum: string;
    up: (context: PostgresMigrationContext) => Promise<void>;
};

export const definePostgresMigration = <Migration extends PostgresMigration>(
    migration: Migration
): Migration => migration;

export const defineSqlMigration = (options: {
    version: number;
    name: string;
    sql: string;
}): PostgresMigration => ({
    version: options.version,
    name: options.name,
    checksum: createHash("sha256").update(options.sql).digest("hex"),
    up: async ({ client }) => {
        await client.query(options.sql);
    },
});
