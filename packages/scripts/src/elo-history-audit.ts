import { Client, types } from "cassandra-driver";

const requiredEnvironment = (name: string): string => {
    const value = process.env[name];

    if (!value) throw new Error("Missing " + name);

    return value;
};

const keyspace = requiredEnvironment("DB_KEYSPACE");

if (!/^\w+$/.test(keyspace)) throw new Error("Invalid DB_KEYSPACE");

const database = new Client({
    contactPoints: [
        requiredEnvironment("DB_HOST") + ":" + Number.parseInt(process.env.DB_PORT ?? "9042"),
    ],
    localDataCenter: requiredEnvironment("DB_DATACENTER"),
    keyspace,
    encoding: { useBigIntAsLong: true },
});

const argument = (name: string) =>
    process.argv.find((value) => value.startsWith("--" + name + "="))?.slice(name.length + 3);

type ResolutionAction = "mark-applied" | "recompute";

const isQuarantined = (contest: types.Row, now = Date.now()) =>
    contest.official &&
    !contest.elo_applied &&
    contest.elo_processing_version !== 1 &&
    new Date(contest.start_time).getTime() + Number(contest.duration_seconds) * 1000 <= now;

const resolveContest = async (contestId: string, action: ResolutionAction) => {
    const contestResult = await database.execute(
        "SELECT id, start_time, duration_seconds, official, elo_applied, elo_processing_version " +
            "FROM contests WHERE id = ?",
        [BigInt(contestId)],
        { prepare: true }
    );

    if (contestResult.rowLength !== 1) throw new Error("Contest not found");

    if (!isQuarantined(contestResult.first()))
        throw new Error("Contest is not in the quarantined legacy state");

    const query =
        action === "mark-applied"
            ? "UPDATE contests SET elo_applied = true WHERE id = ?"
            : "UPDATE contests SET elo_processing_version = 1 WHERE id = ?";

    await database.execute(query, [BigInt(contestId)], { prepare: true });
    console.log(action + " requested for contest " + contestId);
};

const readPendingContests = () =>
    new Promise<types.Row[]>((resolve, reject) => {
        const matches: types.Row[] = [];

        database.eachRow(
            "SELECT id, name, start_time, duration_seconds, official, elo_applied, " +
                "elo_processing_version FROM contests",
            [],
            { autoPage: true },
            (_, row) => {
                if (isQuarantined(row)) matches.push(row);
            },
            (error) => (error ? reject(error) : resolve(matches))
        );
    });

const main = async () => {
    await database.connect();

    const contestId = argument("contest");
    const action = argument("action");

    if (contestId || action) {
        if (!/^\d+$/.test(contestId ?? "")) throw new Error("A numeric --contest is required");

        if (!(["mark-applied", "recompute"] as const).includes(action as ResolutionAction))
            throw new Error("--action must be mark-applied or recompute");

        if (!process.argv.includes("--write")) throw new Error("Pass --write to resolve a contest");

        return resolveContest(contestId!, action as ResolutionAction);
    }

    const pending = await readPendingContests();

    console.table(
        pending.map((row) => ({
            id: row.id.toString(),
            name: row.name,
            endedAt: new Date(
                new Date(row.start_time).getTime() + Number(row.duration_seconds) * 1000
            ).toISOString(),
        }))
    );
    console.log(pending.length + " legacy contest(s) require an explicit decision");
};

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => database.shutdown());
