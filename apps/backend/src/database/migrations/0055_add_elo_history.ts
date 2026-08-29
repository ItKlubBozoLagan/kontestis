import { ContestV9, EloHistoryEntryV1 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    contests: ContestV9;
    elo_history: EloHistoryEntryV1;
};

export const migration_add_elo_history: Migration<MigrationType> = async (database, log) => {
    await database.raw("ALTER TABLE contests ADD elo_processing_version int");

    await database.createTable(
        "elo_history",
        true,
        {
            user_id: { type: "bigint" },
            organisation_id: { type: "bigint" },
            event_id: { type: "text" },
            recorded_at: { type: "timestamp" },
            contest_id: { type: "bigint" },
            delta: { type: "int" },
            resulting_elo: { type: "int" },
            source: { type: "text" },
        },
        ["user_id", "organisation_id"],
        ["event_id"]
    );

    const now = Date.now();
    const contests = await database.selectFrom("contests", "*", {});
    const futureContests = contests.filter(
        (contest) => contest.start_time.getTime() + contest.duration_seconds * 1000 > now
    );

    await Promise.all(
        futureContests.map((contest) =>
            database.update("contests", { elo_processing_version: 1 }, { id: contest.id })
        )
    );

    log(`Enabled retry-safe ELO for ${futureContests.length} scheduled contests`);
    log("Done");
};
