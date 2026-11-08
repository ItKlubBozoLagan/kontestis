import { createHash } from "node:crypto";

import { types } from "cassandra-driver";
import { PoolClient } from "pg";

import { Globals } from "../../globals";
import { Logger } from "../../lib/logger";
import { Database, initLegacyDatabase, LegacyDatabase } from "../Database";
import { KontestisTables, tableDefinitions, TableName, tableNames } from "./tables";

// Scyllo stores the zero-based index, so 53 means migration 0054 has run.
const LATEST_SCYLLA_MIGRATION = 53;
const MIGRATION_LOCK_ID = 4_936_759_210;

const sourceColumns = (table: TableName) => [
    ...tableDefinitions[table].columns,
    ...(tableDefinitions[table].virtualColumns ?? []),
];

const convertSourceValue = (value: unknown): unknown => {
    if (value === null || value === undefined) return value;

    if (
        typeof value === "bigint" ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    )
        return value;

    if (value instanceof Date) return value;

    if (value instanceof types.Long) return BigInt(value.toString());

    if (value instanceof types.LocalDate) return new Date(`${value.toString()}T00:00:00.000Z`);

    if (Buffer.isBuffer(value)) return Buffer.from(value);

    if (value instanceof Set) return [...value].map(convertSourceValue);

    if (value instanceof Map) {
        return Object.fromEntries(
            [...value.entries()].map(([key, entry]) => [
                String(convertSourceValue(key)),
                convertSourceValue(entry),
            ])
        );
    }

    if (Array.isArray(value)) return value.map(convertSourceValue);

    if (typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
                key,
                convertSourceValue(entry),
            ])
        );
    }

    return value;
};

const sourceRowToObject = (row: types.Row): Record<string, unknown> =>
    Object.fromEntries(row.keys().map((column) => [column, convertSourceValue(row.get(column))]));

const canonicalValue = (value: unknown): unknown => {
    if (value === undefined || value === null) return null;

    if (typeof value === "bigint") return { $bigint: value.toString() };

    if (value instanceof Date) return { $date: value.toISOString() };

    if (Buffer.isBuffer(value)) return { $buffer: value.toString("base64") };

    if (value instanceof Set) return [...value].map(canonicalValue).sort();

    if (Array.isArray(value)) return value.map(canonicalValue).sort();

    if (value instanceof Map) return canonicalValue(Object.fromEntries(value));

    if (typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
                .sort(([left], [right]) => left.localeCompare(right))
                .map(([key, entry]) => [key, canonicalValue(entry)])
        );
    }

    return value;
};

const canonicalRow = (table: TableName, row: Record<string, unknown>): string => {
    const normalized = { ...row };

    if (table === "problems" && (normalized.tags === null || normalized.tags === undefined))
        normalized.tags = [];

    if (table === "contest_members") {
        if (normalized.score === null || normalized.score === undefined) normalized.score = {};

        if (normalized.exam_score === null || normalized.exam_score === undefined)
            normalized.exam_score = {};
    }

    return JSON.stringify(
        Object.fromEntries(
            sourceColumns(table).map((column) => [column, canonicalValue(normalized[column])])
        )
    );
};

const addDigest = (digest: Buffer, canonical: string): void => {
    const hash = createHash("sha256").update(canonical).digest();

    for (let index = 0; index < digest.length; index++) digest[index] ^= hash[index];
};

async function currentScyllaVersion(): Promise<number> {
    const result = await LegacyDatabase.raw(
        `SELECT current_version FROM ${Globals.dbKeyspace}.lib_scyllo_migrations WHERE table_key=1`
    );
    const value = result.rows[0]?.get("current_version");

    if (typeof value !== "number")
        throw new Error("Scylla migration version is missing or invalid");

    return value;
}

async function validateSourceSchema(): Promise<void> {
    const result = await LegacyDatabase.client.execute(
        "SELECT table_name, column_name FROM system_schema.columns WHERE keyspace_name=?",
        [Globals.dbKeyspace],
        { prepare: true }
    );
    const actual = new Map<string, Set<string>>();

    for (const row of result.rows) {
        const table = row.get("table_name") as string;
        const column = row.get("column_name") as string;

        actual.set(table, new Set([...(actual.get(table) ?? []), column]));
    }
    const problems: string[] = [];

    for (const table of tableNames) {
        const actualColumns = actual.get(table);

        if (!actualColumns) {
            problems.push(`${table}: table missing`);
            continue;
        }

        for (const column of sourceColumns(table)) {
            if (!actualColumns.has(column)) problems.push(`${table}.${column}: column missing`);
        }
    }

    if (problems.length > 0)
        throw new Error(
            `Scylla schema does not match version ${LATEST_SCYLLA_MIGRATION}: ${problems.join(
                ", "
            )}`
        );
}

// Copying coordinates source paging, transactional checkpoints, and target verification.
// eslint-disable-next-line sonarjs/cognitive-complexity
async function copyTable(table: TableName, client: PoolClient): Promise<void> {
    const existing = await client.query<{
        status: string;
        page_state: string | null;
        source_rows: bigint;
        source_digest: string | null;
    }>(
        "SELECT status, page_state, source_rows, source_digest FROM scylla_migration_tables WHERE table_name=$1",
        [table]
    );

    if (existing.rows[0]?.status === "complete") return;

    let pageState = existing.rows[0]?.page_state ?? undefined;
    let sourceRows = existing.rows[0]?.source_rows ?? 0n;
    const digest = existing.rows[0]?.source_digest
        ? Buffer.from(existing.rows[0].source_digest, "hex")
        : Buffer.alloc(32);

    await client.query(
        `INSERT INTO scylla_migration_tables(table_name, status) VALUES ($1, 'running')
         ON CONFLICT (table_name) DO UPDATE SET status='running', error=NULL, updated_at=now()`,
        [table]
    );

    const query = `SELECT ${sourceColumns(table).join(", ")} FROM ${Globals.dbKeyspace}.${table}`;

    try {
        for (;;) {
            const result = await LegacyDatabase.client.execute(query, [], {
                prepare: false,
                fetchSize: Globals.databaseMigrationBatchSize,
                pageState,
                autoPage: false,
            });
            const rows = result.rows.map(sourceRowToObject);

            for (const row of rows) addDigest(digest, canonicalRow(table, row));

            await client.query("BEGIN");

            try {
                await Database.bulkUpsert(
                    table,
                    rows as Partial<KontestisTables[typeof table]>[],
                    client
                );
                sourceRows += BigInt(rows.length);
                ({ pageState } = result);
                await client.query(
                    `UPDATE scylla_migration_tables
                     SET page_state=$2, source_rows=$3, source_digest=$4, updated_at=now()
                     WHERE table_name=$1`,
                    [table, pageState ?? null, sourceRows, digest.toString("hex")]
                );
                await client.query("COMMIT");
            } catch (error) {
                await client.query("ROLLBACK");
                throw error;
            }

            if (!pageState || sourceRows % 10_000n < BigInt(rows.length)) {
                Logger.database(`Migrated ${table}: ${sourceRows} rows`);
            }

            if (!pageState) break;
        }

        const targetDigest = Buffer.alloc(32);
        let targetRows = 0n;
        let lastPrimaryKey: unknown[] | undefined;

        for (;;) {
            const page = await Database.readPage(
                table,
                lastPrimaryKey,
                Globals.databaseMigrationBatchSize,
                client
            );

            if (page.length === 0) break;

            for (const row of page as Record<string, unknown>[])
                addDigest(targetDigest, canonicalRow(table, row));
            targetRows += BigInt(page.length);
            const lastRow = page.at(-1) as Record<string, unknown>;

            lastPrimaryKey = tableDefinitions[table].primaryKey.map(
                (primaryKey) => lastRow[primaryKey]
            );
        }

        if (sourceRows !== targetRows || !digest.equals(targetDigest)) {
            throw new Error(
                `${table} verification failed: source=${sourceRows}/${digest.toString(
                    "hex"
                )}, target=${targetRows}/${targetDigest.toString("hex")}`
            );
        }

        await client.query(
            `UPDATE scylla_migration_tables
             SET status='complete', page_state=NULL, target_rows=$2, target_digest=$3, updated_at=now(), error=NULL
             WHERE table_name=$1`,
            [table, targetRows, targetDigest.toString("hex")]
        );
    } catch (error) {
        await client.query(
            "UPDATE scylla_migration_tables SET status='failed', error=$2, updated_at=now() WHERE table_name=$1",
            [table, error instanceof Error ? error.stack ?? error.message : String(error)]
        );
        throw error;
    }
}

const integrityChecks: Record<string, string> = {
    duplicate_contest_members:
        "SELECT COUNT(*)::bigint AS count FROM (SELECT contest_id, user_id FROM contest_members GROUP BY contest_id, user_id HAVING COUNT(*) > 1) duplicates",
    duplicate_organisation_members:
        "SELECT COUNT(*)::bigint AS count FROM (SELECT organisation_id, user_id FROM organisation_members GROUP BY organisation_id, user_id HAVING COUNT(*) > 1) duplicates",
    orphan_problems:
        "SELECT COUNT(*)::bigint AS count FROM problems child LEFT JOIN contests parent ON parent.id=child.contest_id WHERE child.contest_id IS NOT NULL AND parent.id IS NULL",
    orphan_clusters:
        "SELECT COUNT(*)::bigint AS count FROM clusters child LEFT JOIN problems parent ON parent.id=child.problem_id WHERE child.problem_id IS NOT NULL AND parent.id IS NULL",
    orphan_testcases:
        "SELECT COUNT(*)::bigint AS count FROM testcases child LEFT JOIN clusters parent ON parent.id=child.cluster_id WHERE child.cluster_id IS NOT NULL AND parent.id IS NULL",
    orphan_submissions_users:
        "SELECT COUNT(*)::bigint AS count FROM submissions child LEFT JOIN users parent ON parent.id=child.user_id WHERE child.user_id IS NOT NULL AND parent.id IS NULL",
    orphan_submissions_problems:
        "SELECT COUNT(*)::bigint AS count FROM submissions child LEFT JOIN problems parent ON parent.id=child.problem_id WHERE child.problem_id IS NOT NULL AND parent.id IS NULL",
    orphan_contest_members_users:
        "SELECT COUNT(*)::bigint AS count FROM contest_members child LEFT JOIN users parent ON parent.id=child.user_id WHERE child.user_id IS NOT NULL AND parent.id IS NULL",
    orphan_contest_members_contests:
        "SELECT COUNT(*)::bigint AS count FROM contest_members child LEFT JOIN contests parent ON parent.id=child.contest_id WHERE child.contest_id IS NOT NULL AND parent.id IS NULL",
    orphan_score_problems:
        "SELECT COUNT(*)::bigint AS count FROM contest_member_scores child LEFT JOIN problems parent ON parent.id=child.problem_id WHERE parent.id IS NULL",
    orphan_exam_score_problems:
        "SELECT COUNT(*)::bigint AS count FROM contest_member_exam_scores child LEFT JOIN problems parent ON parent.id=child.problem_id WHERE parent.id IS NULL",
};

async function auditIntegrity(client: PoolClient): Promise<void> {
    for (const [name, query] of Object.entries(integrityChecks)) {
        const result = await client.query<{ count: bigint }>(query);

        await client.query(
            `INSERT INTO scylla_migration_integrity(check_name, violation_count, checked_at)
             VALUES ($1, $2, now())
             ON CONFLICT (check_name) DO UPDATE SET violation_count=EXCLUDED.violation_count, checked_at=now()`,
            [name, result.rows[0].count]
        );
    }
}

export async function migrateScyllaToPostgres(): Promise<void> {
    const client = await Database.pool.connect();

    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);

    try {
        const completed = await client.query<{ status: string }>(
            "SELECT status FROM scylla_migration WHERE migration_key=1"
        );

        if (completed.rows[0]?.status === "complete") return;

        if (!Globals.scyllaMigrationEnabled) {
            throw new Error(
                "PostgreSQL has not been populated and SCYLLA_MIGRATION_ENABLED is not true"
            );
        }

        await LegacyDatabase.awaitConnection();
        const before = await currentScyllaVersion();

        if (before > LATEST_SCYLLA_MIGRATION) {
            throw new Error(
                `Scylla schema version ${before} is newer than supported version ${LATEST_SCYLLA_MIGRATION}`
            );
        }

        await initLegacyDatabase();
        const sourceVersion = await currentScyllaVersion();

        if (sourceVersion !== LATEST_SCYLLA_MIGRATION) {
            throw new Error(
                `Scylla upgrade stopped at version ${sourceVersion}; expected ${LATEST_SCYLLA_MIGRATION}`
            );
        }

        await validateSourceSchema();

        await client.query(
            `INSERT INTO scylla_migration(migration_key, source_schema_version, status, started_at, completed_at, error)
             VALUES (1, $1, 'running', now(), NULL, NULL)
             ON CONFLICT (migration_key) DO UPDATE SET source_schema_version=EXCLUDED.source_schema_version,
                 status='running', completed_at=NULL, error=NULL`,
            [sourceVersion]
        );

        for (const table of tableNames) await copyTable(table, client);
        await auditIntegrity(client);
        await client.query(
            "UPDATE scylla_migration SET status='complete', completed_at=now(), error=NULL WHERE migration_key=1"
        );
        Logger.database("Scylla to PostgreSQL migration verified successfully");
    } catch (error) {
        await client.query(
            `INSERT INTO scylla_migration(migration_key, source_schema_version, status, error)
             VALUES (1, 0, 'failed', $1)
             ON CONFLICT (migration_key) DO UPDATE SET status='failed', error=EXCLUDED.error`,
            [error instanceof Error ? error.stack ?? error.message : String(error)]
        );
        throw error;
    } finally {
        await LegacyDatabase.shutdown().catch(() => {});
        await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]);
        client.release();
    }
}
