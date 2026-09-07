/* eslint-disable no-dupe-class-members, sonarjs/no-all-duplicated-branches */

import { Pool, PoolClient, QueryResult, QueryResultRow, types as pgTypes } from "pg";

import { Globals } from "../../globals";
import { Logger } from "../../lib/logger";
import { EqualityExpression, isEqualityExpression } from "./criteria";
import { KontestisTables, tableDefinitions, TableName } from "./tables";

pgTypes.setTypeParser(20, (value) => BigInt(value));
pgTypes.setTypeParser(1082, (value) => new Date(`${value}T00:00:00.000Z`));

export type Runner = Pick<Pool | PoolClient, "query">;
export type Criteria<Row> = {
    [Column in keyof Row]?:
        | Row[Column]
        | EqualityExpression<Exclude<Row[Column], null | undefined>>;
};
type Selected<Row, Column extends keyof Row> = Pick<Row, Column>;

const own = (object: object, key: PropertyKey) => Object.prototype.hasOwnProperty.call(object, key);

export class PostgresDatabase {
    readonly pool: Pool;

    constructor(connectionString = Globals.postgresUrl) {
        this.pool = new Pool({ connectionString });
        this.pool.on("error", (error) => Logger.database("PostgreSQL pool error", error));
    }

    async awaitConnection(): Promise<void> {
        await this.pool.query("SELECT 1");
    }

    async shutdown(): Promise<void> {
        await this.pool.end();
    }

    async withTransaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
        const client = await this.pool.connect();

        await client.query("BEGIN");

        try {
            const result = await operation(client);

            await client.query("COMMIT");

            return result;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    private definition(table: TableName) {
        const definition = tableDefinitions[table];

        if (!definition) throw new Error(`Unknown table: ${table}`);

        return definition;
    }

    private assertColumn(table: TableName, column: string, includeVirtual = true): void {
        const definition = this.definition(table);

        if (
            !definition.columns.includes(column) &&
            !(includeVirtual && definition.virtualColumns?.includes(column))
        ) {
            throw new Error(`Unknown column ${table}.${column}`);
        }
    }

    private where<Row>(table: TableName, criteria: Criteria<Row> | undefined, offset = 0) {
        if (!criteria || Object.keys(criteria).length === 0)
            return { sql: "", values: [] as unknown[] };

        const values: unknown[] = [];
        const expressions = Object.entries(criteria).map(([column, criterion]) => {
            this.assertColumn(table, column, false);

            if (!isEqualityExpression(criterion)) {
                values.push(criterion);

                return `"${column}" = $${offset + values.length}`;
            }

            if (criterion.operation === "in") {
                if (criterion.values.length === 0) return "FALSE";

                const placeholders = criterion.values.map((value) => {
                    values.push(value);

                    return `$${offset + values.length}`;
                });

                return `"${column}" IN (${placeholders.join(", ")})`;
            }

            values.push(criterion.values[0]);

            return `"${column}" ${criterion.operation} $${offset + values.length}`;
        });

        return { sql: ` WHERE ${expressions.join(" AND ")}`, values };
    }

    // Hydration deliberately handles both normalized legacy collection shapes in one place.
    // eslint-disable-next-line sonarjs/cognitive-complexity
    private async hydrate(table: TableName, rows: Record<string, unknown>[], runner: Runner) {
        if (rows.length === 0) return rows;

        if (table === "problems") {
            const ids = rows.map((row) => row.id);
            const tags = await runner.query<{ problem_id: bigint; tag: string }>(
                "SELECT problem_id, tag FROM problem_tags WHERE problem_id = ANY($1::bigint[]) ORDER BY tag",
                [ids]
            );
            const byProblem = new Map<string, string[]>();

            for (const tag of tags.rows) {
                const key = tag.problem_id.toString();

                byProblem.set(key, [...(byProblem.get(key) ?? []), tag.tag]);
            }

            for (const row of rows) row.tags = byProblem.get(String(row.id)) ?? [];
        }

        if (table === "contest_members") {
            const ids = rows.map((row) => row.id);
            const [scores, examScores] = await Promise.all([
                runner.query<{
                    contest_member_id: bigint;
                    contest_id: bigint;
                    user_id: bigint;
                    problem_id: bigint;
                    score: number;
                }>(
                    "SELECT contest_member_id, contest_id, user_id, problem_id, score FROM contest_member_scores WHERE contest_member_id = ANY($1::bigint[])",
                    [ids]
                ),
                runner.query<{
                    contest_member_id: bigint;
                    contest_id: bigint;
                    user_id: bigint;
                    problem_id: bigint;
                    score: number;
                }>(
                    "SELECT contest_member_id, contest_id, user_id, problem_id, score FROM contest_member_exam_scores WHERE contest_member_id = ANY($1::bigint[])",
                    [ids]
                ),
            ]);
            const toMap = (entries: typeof scores.rows) => {
                const result = new Map<string, Record<string, number>>();

                for (const entry of entries) {
                    const key = `${entry.contest_member_id}:${entry.contest_id}:${entry.user_id}`;

                    result.set(key, {
                        ...result.get(key),
                        [entry.problem_id.toString()]: entry.score,
                    });
                }

                return result;
            };
            const scoreMap = toMap(scores.rows);
            const examScoreMap = toMap(examScores.rows);

            for (const row of rows) {
                const key = `${row.id}:${row.contest_id}:${row.user_id}`;

                row.score = scoreMap.get(key) ?? {};
                row.exam_score = examScoreMap.get(key) ?? {};
            }
        }

        return rows;
    }

    selectFrom<Table extends TableName>(
        table: Table,
        select: "*",
        criteria?: Criteria<KontestisTables[Table]>,
        runner?: Runner
    ): Promise<KontestisTables[Table][]>;
    selectFrom<Table extends TableName, Column extends keyof KontestisTables[Table]>(
        table: Table,
        select: readonly Column[],
        criteria?: Criteria<KontestisTables[Table]>,
        runner?: Runner
    ): Promise<Selected<KontestisTables[Table], Column>[]>;
    async selectFrom<Table extends TableName, Column extends keyof KontestisTables[Table]>(
        table: Table,
        select: "*" | readonly Column[],
        criteria?: Criteria<KontestisTables[Table]>,
        runner: Runner = this.pool
    ): Promise<(KontestisTables[Table] | Selected<KontestisTables[Table], Column>)[]> {
        const definition = this.definition(table);
        const requested =
            select === "*"
                ? [...definition.columns, ...(definition.virtualColumns ?? [])]
                : select.map(String);

        for (const column of requested) this.assertColumn(table, column);
        const needsHydration = requested.some((column) =>
            definition.virtualColumns?.includes(column)
        );
        const baseColumns = requested.filter((column) => definition.columns.includes(column));

        if (needsHydration && !baseColumns.includes("id")) baseColumns.push("id");

        const where = this.where(table, criteria);
        const result = await runner.query<Record<string, unknown>>(
            `SELECT ${baseColumns.map((column) => `"${column}"`).join(", ")} FROM "${table}"${
                where.sql
            }`,
            where.values
        );

        if (needsHydration) await this.hydrate(table, result.rows, runner);

        return result.rows.map((row) =>
            Object.fromEntries(requested.map((column) => [column, row[column]]))
        ) as (KontestisTables[Table] | Selected<KontestisTables[Table], Column>)[];
    }

    selectOneFrom<Table extends TableName>(
        table: Table,
        select: "*",
        criteria?: Criteria<KontestisTables[Table]>,
        runner?: Runner
    ): Promise<KontestisTables[Table] | undefined>;
    selectOneFrom<Table extends TableName, Column extends keyof KontestisTables[Table]>(
        table: Table,
        select: readonly Column[],
        criteria?: Criteria<KontestisTables[Table]>,
        runner?: Runner
    ): Promise<Selected<KontestisTables[Table], Column> | undefined>;
    async selectOneFrom<Table extends TableName, Column extends keyof KontestisTables[Table]>(
        table: Table,
        select: "*" | readonly Column[],
        criteria?: Criteria<KontestisTables[Table]>,
        runner: Runner = this.pool
    ): Promise<KontestisTables[Table] | Selected<KontestisTables[Table], Column> | undefined> {
        const rows =
            select === "*"
                ? await this.selectFrom(table, select, criteria, runner)
                : await this.selectFrom(table, select, criteria, runner);

        return rows[0];
    }

    async count<Table extends TableName>(
        table: Table,
        criteria?: Criteria<KontestisTables[Table]>,
        runner: Runner = this.pool
    ): Promise<bigint> {
        const where = this.where(table, criteria);
        const result = await runner.query<{ count: bigint }>(
            `SELECT COUNT(*) AS count FROM "${table}"${where.sql}`,
            where.values
        );

        return result.rows[0].count;
    }

    async readPage<Table extends TableName>(
        table: Table,
        after: unknown[] | undefined,
        limit: number,
        runner: Runner
    ): Promise<KontestisTables[Table][]> {
        const definition = this.definition(table);
        const primaryKeys = definition.primaryKey;
        const cursorWhere =
            after === undefined
                ? ""
                : ` WHERE (${primaryKeys
                      .map((column) => `"${column}"`)
                      .join(", ")}) > (${primaryKeys
                      .map((_, index) => `$${index + 1}`)
                      .join(", ")})`;
        const result = await runner.query<Record<string, unknown>>(
            `SELECT ${definition.columns
                .map((column) => `"${column}"`)
                .join(", ")} FROM "${table}"${cursorWhere} ORDER BY ${primaryKeys
                .map((column) => `"${column}"`)
                .join(", ")} LIMIT $${after === undefined ? 1 : primaryKeys.length + 1}`,
            after === undefined ? [limit] : [...after, limit]
        );

        await this.hydrate(table, result.rows, runner);

        return result.rows as KontestisTables[Table][];
    }

    private async replaceTags(problemId: unknown, tags: unknown, runner: Runner): Promise<void> {
        await runner.query("DELETE FROM problem_tags WHERE problem_id = $1", [problemId]);

        for (const tag of (tags as string[] | Set<string> | undefined) ?? []) {
            await runner.query(
                "INSERT INTO problem_tags(problem_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                [problemId, tag]
            );
        }
    }

    private async replaceScores(
        member: { id: unknown; contest_id: unknown; user_id: unknown },
        scores: unknown,
        target: "contest_member_scores" | "contest_member_exam_scores",
        runner: Runner
    ): Promise<void> {
        await runner.query(
            `DELETE FROM ${target} WHERE contest_member_id=$1 AND contest_id=$2 AND user_id=$3`,
            [member.id, member.contest_id, member.user_id]
        );

        for (const [problemId, score] of Object.entries((scores as Record<string, number>) ?? {})) {
            await runner.query(
                `INSERT INTO ${target}(contest_member_id, contest_id, user_id, problem_id, score) VALUES ($1, $2, $3, $4, $5)`,
                [member.id, member.contest_id, member.user_id, BigInt(problemId), score]
            );
        }
    }

    private async insertWithRunner<Table extends TableName>(
        table: Table,
        object: Partial<KontestisTables[Table]>,
        runner: Runner
    ): Promise<QueryResult> {
        const definition = this.definition(table);
        const record = object as Record<string, unknown>;
        const entries = Object.entries(record).filter(
            ([column, value]) => definition.columns.includes(column) && value !== undefined
        );

        if (entries.length === 0) throw new Error(`Cannot insert an empty ${table} row`);

        const columns = entries.map(([column]) => column);
        const values = entries.map(([, value]) => value);
        const updates = columns.filter((column) => !definition.primaryKey.includes(column));
        const conflict =
            updates.length > 0
                ? `DO UPDATE SET ${updates
                      .map((column) => `"${column}" = EXCLUDED."${column}"`)
                      .join(", ")}`
                : "DO NOTHING";
        const result = await runner.query(
            `INSERT INTO "${table}" (${columns
                .map((column) => `"${column}"`)
                .join(", ")}) VALUES (${values
                .map((_, index) => `$${index + 1}`)
                .join(", ")}) ON CONFLICT (${definition.primaryKey
                .map((column) => `"${column}"`)
                .join(", ")}) ${conflict}`,
            values
        );
        const primaryKey = record[definition.primaryKey[0]];

        if (table === "problems" && own(record, "tags"))
            await this.replaceTags(primaryKey, record.tags, runner);

        if (table === "contest_members") {
            const member = {
                id: record.id,
                contest_id: record.contest_id,
                user_id: record.user_id,
            };

            if (own(record, "score"))
                await this.replaceScores(member, record.score, "contest_member_scores", runner);

            if (own(record, "exam_score"))
                await this.replaceScores(
                    member,
                    record.exam_score,
                    "contest_member_exam_scores",
                    runner
                );
        }

        return result;
    }

    async insertInto<Table extends TableName>(
        table: Table,
        object: Partial<KontestisTables[Table]>,
        runner?: Runner
    ): Promise<QueryResult> {
        if (runner) return this.insertWithRunner(table, object, runner);

        return this.withTransaction((client) => this.insertWithRunner(table, object, client));
    }

    async bulkUpsert<Table extends TableName>(
        table: Table,
        objects: Partial<KontestisTables[Table]>[],
        client: PoolClient
    ): Promise<void> {
        if (objects.length === 0) return;

        const definition = this.definition(table);
        const { columns } = definition;
        const values = objects.flatMap((object) =>
            columns.map((column) => (object as Record<string, unknown>)[column] ?? null)
        );
        const tuples = objects.map(
            (_, rowIndex) =>
                `(${columns
                    .map((__, columnIndex) => `$${rowIndex * columns.length + columnIndex + 1}`)
                    .join(", ")})`
        );
        const updates = columns.filter((column) => !definition.primaryKey.includes(column));

        await client.query(
            `INSERT INTO "${table}" (${columns
                .map((column) => `"${column}"`)
                .join(", ")}) VALUES ${tuples.join(", ")} ON CONFLICT (${definition.primaryKey
                .map((column) => `"${column}"`)
                .join(", ")}) DO UPDATE SET ${updates
                .map((column) => `"${column}" = EXCLUDED."${column}"`)
                .join(", ")}`,
            values
        );

        if (table === "problems") {
            const ids = objects.map((object) => (object as Record<string, unknown>).id);

            await client.query("DELETE FROM problem_tags WHERE problem_id = ANY($1::bigint[])", [
                ids,
            ]);
            const tags = objects.flatMap((object) => {
                const row = object as Record<string, unknown>;

                return [...((row.tags as string[] | Set<string> | undefined) ?? [])].map((tag) => [
                    row.id,
                    tag,
                ]);
            });

            if (tags.length > 0) {
                const tagValues = tags.flat();
                const tagTuples = tags.map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`);

                await client.query(
                    `INSERT INTO problem_tags(problem_id, tag) VALUES ${tagTuples.join(
                        ", "
                    )} ON CONFLICT DO NOTHING`,
                    tagValues
                );
            }
        }

        if (table === "contest_members") {
            for (const object of objects) {
                const row = object as Record<string, unknown>;

                await client.query(
                    "DELETE FROM contest_member_scores WHERE contest_member_id=$1 AND contest_id=$2 AND user_id=$3",
                    [row.id, row.contest_id, row.user_id]
                );
                await client.query(
                    "DELETE FROM contest_member_exam_scores WHERE contest_member_id=$1 AND contest_id=$2 AND user_id=$3",
                    [row.id, row.contest_id, row.user_id]
                );
            }

            for (const [field, target] of [
                ["score", "contest_member_scores"],
                ["exam_score", "contest_member_exam_scores"],
            ] as const) {
                const scores = objects.flatMap((object) => {
                    const row = object as Record<string, unknown>;

                    return Object.entries((row[field] as Record<string, number>) ?? {}).map(
                        ([problemId, score]) => [
                            row.id,
                            row.contest_id,
                            row.user_id,
                            BigInt(problemId),
                            score,
                        ]
                    );
                });

                if (scores.length === 0) continue;

                const scoreValues = scores.flat();
                const scoreTuples = scores.map(
                    (_, index) =>
                        `($${index * 5 + 1}, $${index * 5 + 2}, $${index * 5 + 3}, $${
                            index * 5 + 4
                        }, $${index * 5 + 5})`
                );

                await client.query(
                    `INSERT INTO ${target}(contest_member_id, contest_id, user_id, problem_id, score) VALUES ${scoreTuples.join(
                        ", "
                    )} ON CONFLICT (contest_member_id, contest_id, user_id, problem_id) DO UPDATE SET score = EXCLUDED.score`,
                    scoreValues
                );
            }
        }
    }

    // Updates may include either base columns or normalized collection replacements.
    // eslint-disable-next-line sonarjs/cognitive-complexity
    private async updateWithRunner<Table extends TableName>(
        table: Table,
        object: Partial<KontestisTables[Table]>,
        criteria: Criteria<KontestisTables[Table]>,
        runner: Runner
    ): Promise<QueryResult> {
        const definition = this.definition(table);
        const record = object as Record<string, unknown>;
        const entries = Object.entries(record).filter(
            ([column, value]) => definition.columns.includes(column) && value !== undefined
        );
        const where = this.where(table, criteria, entries.length);
        const result: QueryResult =
            entries.length > 0
                ? await runner.query(
                      `UPDATE "${table}" SET ${entries
                          .map(([column], index) => `"${column}" = $${index + 1}`)
                          .join(", ")}${where.sql}`,
                      [...entries.map(([, value]) => value), ...where.values]
                  )
                : { command: "UPDATE", rowCount: 0, oid: 0, fields: [], rows: [] };

        if (
            (table === "problems" && own(record, "tags")) ||
            (table === "contest_members" && (own(record, "score") || own(record, "exam_score")))
        ) {
            const keys = tableDefinitions[table].primaryKey as (keyof KontestisTables[Table])[];
            const matched = await this.selectFrom(table, keys, criteria, runner);

            for (const row of matched as Record<string, unknown>[]) {
                if (table === "problems" && own(record, "tags"))
                    await this.replaceTags(row.id, record.tags, runner);

                const member = { id: row.id, contest_id: row.contest_id, user_id: row.user_id };

                if (table === "contest_members" && own(record, "score"))
                    await this.replaceScores(member, record.score, "contest_member_scores", runner);

                if (table === "contest_members" && own(record, "exam_score"))
                    await this.replaceScores(
                        member,
                        record.exam_score,
                        "contest_member_exam_scores",
                        runner
                    );
            }
        }

        return result;
    }

    async update<Table extends TableName>(
        table: Table,
        object: Partial<KontestisTables[Table]>,
        criteria: Criteria<KontestisTables[Table]>,
        runner?: Runner
    ): Promise<QueryResult> {
        if (runner) return this.updateWithRunner(table, object, criteria, runner);

        return this.withTransaction((client) =>
            this.updateWithRunner(table, object, criteria, client)
        );
    }

    async deleteFrom<Table extends TableName, Column extends keyof KontestisTables[Table]>(
        table: Table,
        fields: "*" | Column[],
        criteria: Criteria<KontestisTables[Table]>,
        runner: Runner = this.pool
    ): Promise<QueryResult> {
        if (fields !== "*")
            throw new Error("PostgreSQL repositories only support whole-row deletion");

        const where = this.where(table, criteria);

        return runner.query(`DELETE FROM "${table}"${where.sql}`, where.values);
    }

    async setMapEntry(
        member: { id: bigint; contest_id: bigint; user_id: bigint },
        map: "score" | "exam_score",
        problemId: bigint,
        score: number,
        runner: Runner = this.pool
    ): Promise<void> {
        const table = map === "score" ? "contest_member_scores" : "contest_member_exam_scores";

        await runner.query(
            `INSERT INTO ${table}(contest_member_id, contest_id, user_id, problem_id, score) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (contest_member_id, contest_id, user_id, problem_id) DO UPDATE SET score = EXCLUDED.score`,
            [member.id, member.contest_id, member.user_id, problemId, score]
        );
    }

    raw<Row extends QueryResultRow = QueryResultRow>(query: string): Promise<QueryResult<Row>> {
        return this.pool.query(query);
    }

    rawWithParams<Row extends QueryResultRow = QueryResultRow>(
        query: string,
        parameters: readonly unknown[]
    ): Promise<QueryResult<Row>> {
        return this.pool.query<Row>(query, [...parameters]);
    }

    batch(): PostgresBatch {
        return new PostgresBatch(this);
    }
}

class PostgresBatch {
    private readonly operations: ((client: PoolClient) => Promise<unknown>)[] = [];

    constructor(private readonly database: PostgresDatabase) {}

    insertInto<Table extends TableName>(
        table: Table,
        object: Partial<KontestisTables[Table]>
    ): this {
        this.operations.push((client) => this.database.insertInto(table, object, client));

        return this;
    }

    update<Table extends TableName>(
        table: Table,
        object: Partial<KontestisTables[Table]>,
        criteria: Criteria<KontestisTables[Table]>
    ): this {
        this.operations.push((client) => this.database.update(table, object, criteria, client));

        return this;
    }

    deleteFrom<Table extends TableName, Column extends keyof KontestisTables[Table]>(
        table: Table,
        fields: "*" | Column[],
        criteria: Criteria<KontestisTables[Table]>
    ): this {
        this.operations.push((client) => this.database.deleteFrom(table, fields, criteria, client));

        return this;
    }

    execute(): Promise<void> {
        return this.database.withTransaction(async (client) => {
            for (const operation of this.operations) await operation(client);
        });
    }
}
