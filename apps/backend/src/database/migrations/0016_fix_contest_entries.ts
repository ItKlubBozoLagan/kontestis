import { ContestV3 } from "@kontestis/models";
import { Migration } from "scyllo";

import { Database } from "../Database";

type MigrationType = {
    contests: ContestV3;
};

export const migration_fix_contest_entries: Migration<MigrationType> = async (database, log) => {
    const contests = await database.selectFrom("contests", "*");

    for (const c of contests) {
        await Database.update("contests", { elo_applied: false, official: false }, { id: c.id });
    }

    log("Done");
};
