import { createHash } from "node:crypto";
import fs from "node:fs/promises";

import { InfluxDB } from "@influxdata/influxdb-client";
import { Client } from "cassandra-driver";

type LegacyPoint = {
    rawTime: string;
    recordedAt: Date;
    score: number;
};

type Member = {
    userId: bigint;
    organisationId: bigint;
    elo: number;
};

type NativeState = {
    currentElo: number;
    events: Array<{ eventId: string; delta: number; recordedAt: Date }>;
};

const requiredEnvironment = (name: string): string => {
    const value = process.env[name];

    if (!value) throw new Error(`Missing ${name}`);

    return value;
};

const databaseKeyspace = requiredEnvironment("DB_KEYSPACE");

if (!/^\w+$/.test(databaseKeyspace)) throw new Error("Invalid DB_KEYSPACE");

const write = process.argv.includes("--write");
const checkpointArgument = process.argv.find((argument) => argument.startsWith("--checkpoint="));
const checkpointPath = checkpointArgument?.slice("--checkpoint=".length);

const database = new Client({
    contactPoints: [
        `${requiredEnvironment("DB_HOST")}:${Number.parseInt(process.env.DB_PORT ?? "9042")}`,
    ],
    localDataCenter: requiredEnvironment("DB_DATACENTER"),
    keyspace: databaseKeyspace,
    encoding: { useBigIntAsLong: true },
});

const influx = new InfluxDB({
    url: requiredEnvironment("INFLUXDB_URL"),
    token: requiredEnvironment("INFLUXDB_TOKEN"),
});

const influxBucket = requiredEnvironment("INFLUXDB_BUCKET");
const influxOrganisation = requiredEnvironment("INFLUXDB_ORG");

const partitionKey = (userId: bigint, organisationId: bigint) => `${userId}:${organisationId}`;

const readCheckpoint = async (): Promise<Set<string>> => {
    if (!checkpointPath) return new Set();

    try {
        const data = JSON.parse((await fs.readFile(checkpointPath)).toString("utf8")) as {
            completed?: string[];
        };

        return new Set(data.completed ?? []);
    } catch (error) {
        if ((error as { code?: string }).code === "ENOENT") return new Set();

        throw error;
    }
};

const writeCheckpoint = async (completed: Set<string>) => {
    if (!write || !checkpointPath) return;

    await fs.writeFile(
        checkpointPath,
        JSON.stringify({ completed: [...completed].sort() }, undefined, 2) + "\n"
    );
};

const readMembers = async (): Promise<Member[]> => {
    return new Promise((resolve, reject) => {
        const members: Member[] = [];

        database.eachRow(
            "SELECT user_id, organisation_id, elo FROM organisation_members",
            [],
            { autoPage: true },
            (_, row) => {
                members.push({
                    userId: BigInt(row.user_id.toString()),
                    organisationId: BigInt(row.organisation_id.toString()),
                    elo: Number(row.elo),
                });
            },
            (error) => (error ? reject(error) : resolve(members))
        );
    });
};

const readLegacyPoints = (): Promise<Map<string, LegacyPoint[]>> =>
    new Promise((resolve, reject) => {
        const points = new Map<string, LegacyPoint[]>();
        const query = `from(bucket: ${JSON.stringify(influxBucket)})
            |> range(start: time(v: 0))
            |> filter(fn: (r) => r._measurement == "elo" and r._field == "score")
            |> keep(columns: ["_time", "_value", "userId", "orgId"])
            |> sort(columns: ["_time"])`;

        influx.getQueryApi(influxOrganisation).queryRows(query, {
            next: (row, metadata) => {
                const value = metadata.toObject(row) as Record<string, unknown>;
                const userId = String(value.userId ?? "");
                const organisationId = String(value.orgId ?? "");
                const rawTime = String(value._time ?? "");
                const score = Number(value._value);
                const recordedAt = new Date(rawTime);

                if (
                    !/^\d+$/.test(userId) ||
                    !/^\d+$/.test(organisationId) ||
                    !Number.isFinite(score) ||
                    Number.isNaN(recordedAt.getTime())
                ) {
                    console.error("Skipping malformed Influx ELO point", value);

                    return;
                }

                const key = `${userId}:${organisationId}`;
                const partition = points.get(key) ?? [];

                partition.push({ rawTime, recordedAt, score: Math.trunc(score) });
                points.set(key, partition);
            },
            error: reject,
            complete: () => resolve(points),
        });
    });

const readNativeState = async (member: Member): Promise<NativeState> => {
    const [memberResult, historyResult] = await Promise.all([
        database.execute(
            `SELECT elo FROM organisation_members
             WHERE user_id = ? AND organisation_id = ? ALLOW FILTERING`,
            [member.userId, member.organisationId],
            { prepare: true }
        ),
        database.execute(
            `SELECT event_id, delta, recorded_at FROM elo_history
             WHERE user_id = ? AND organisation_id = ?`,
            [member.userId, member.organisationId],
            { prepare: true }
        ),
    ]);

    if (memberResult.rowLength !== 1) throw new Error("Organisation member changed during import");

    return {
        currentElo: Number(memberResult.first().elo),
        events: historyResult.rows
            .filter((row) => String(row.event_id).startsWith("contest:"))
            .map((row) => ({
                eventId: String(row.event_id),
                delta: Number(row.delta),
                recordedAt: new Date(row.recorded_at),
            }))
            .sort((a, b) => a.eventId.localeCompare(b.eventId)),
    };
};

const stateSignature = (state: NativeState) =>
    JSON.stringify({
        currentElo: state.currentElo,
        events: state.events.map((event) => [
            event.eventId,
            event.delta,
            event.recordedAt.toISOString(),
        ]),
    });

const insertHistory = async (
    member: Member,
    eventId: string,
    recordedAt: Date,
    delta: number,
    resultingElo: number,
    source: "legacy" | "reconciliation"
) => {
    if (!write) return;

    await database.execute(
        `INSERT INTO elo_history
         (user_id, organisation_id, event_id, recorded_at, delta, resulting_elo, source)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [member.userId, member.organisationId, eventId, recordedAt, delta, resultingElo, source],
        { prepare: true }
    );
};

const importPartition = async (member: Member, sourcePoints: LegacyPoint[]) => {
    const before = await readNativeState(member);
    const firstNativeTime = before.events.reduce(
        (minimum, event) => Math.min(minimum, event.recordedAt.getTime()),
        Number.POSITIVE_INFINITY
    );
    const points = sourcePoints
        .filter((point) => point.recordedAt.getTime() < firstNativeTime)
        .sort(
            (a, b) =>
                a.recordedAt.getTime() - b.recordedAt.getTime() ||
                a.rawTime.localeCompare(b.rawTime) ||
                a.score - b.score
        );

    let previousScore: number | undefined;

    for (const [index, point] of points.entries()) {
        const eventHash = createHash("sha256")
            .update(
                `${member.userId}:${member.organisationId}:${point.rawTime}:${point.score}:${index}`
            )
            .digest("hex")
            .slice(0, 32);
        const delta = previousScore === undefined ? 0 : point.score - previousScore;

        await insertHistory(
            member,
            `legacy:${eventHash}`,
            point.recordedAt,
            delta,
            point.score,
            "legacy"
        );
        previousScore = point.score;
    }

    for (let attempt = 0; attempt < 3; attempt++) {
        const after = await readNativeState(member);

        if (attempt === 0 && stateSignature(before) !== stateSignature(after)) continue;

        const nativeDelta = after.events.reduce((sum, event) => sum + event.delta, 0);
        const cutoverElo = after.currentElo - nativeDelta;
        const earliestNative = after.events.reduce(
            (minimum, event) => Math.min(minimum, event.recordedAt.getTime()),
            Number.POSITIVE_INFINITY
        );
        const latestLegacy = points.at(-1)?.recordedAt.getTime() ?? 0;
        const reconciliationTime = Number.isFinite(earliestNative)
            ? new Date(Math.max(0, earliestNative - 1))
            : new Date(Math.max(Date.now(), latestLegacy + 1));

        await insertHistory(
            member,
            "legacy:reconciliation:v1",
            reconciliationTime,
            previousScore === undefined ? 0 : cutoverElo - previousScore,
            cutoverElo,
            "reconciliation"
        );

        const stable = await readNativeState(member);

        if (stateSignature(after) === stateSignature(stable)) return;
    }

    throw new Error("Native ELO changed repeatedly during import");
};

const main = async () => {
    console.log(write ? "Writing ELO history" : "Dry run only; pass --write to persist");

    await database.connect();

    const [members, legacyPoints, completed] = await Promise.all([
        readMembers(),
        readLegacyPoints(),
        readCheckpoint(),
    ]);
    let imported = 0;
    let failed = 0;

    for (const member of members) {
        const key = partitionKey(member.userId, member.organisationId);

        if (completed.has(key)) continue;

        try {
            await importPartition(member, legacyPoints.get(key) ?? []);
            completed.add(key);
            imported++;
            await writeCheckpoint(completed);
        } catch (error) {
            failed++;
            console.error(`Failed ${key}`, error);
        }
    }

    const knownMembers = new Set(
        members.map((member) => partitionKey(member.userId, member.organisationId))
    );
    const orphaned = [...legacyPoints.keys()].filter((key) => !knownMembers.has(key));

    console.log({ imported, failed, orphaned: orphaned.length, totalMembers: members.length });

    if (orphaned.length > 0) console.error("Skipped deleted member partitions", orphaned);

    if (failed > 0) process.exitCode = 1;

    await database.shutdown();
};

main().catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
    await database.shutdown().catch(() => {});
});
