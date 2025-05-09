import { ContestV8 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    contests: ContestV8;
};

export const migration_contest_show_leaderboard: Migration<MigrationType> = async (
    database,
    log
) => {
    await database.raw("ALTER TABLE contests ADD show_leaderboard_during_contest boolean");

    const contests = await database.selectFrom("contests", ["id"]);

    for (const contest of contests) {
        await database.update(
            "contests",
            { show_leaderboard_during_contest: true },
            { id: contest.id }
        );
    }

    log("Done");
};
