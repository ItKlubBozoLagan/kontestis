import { ContestV2 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    contests: ContestV2;
};

export const migration_index_by_elo_state: Migration<MigrationType> = async (database, log) => {
    await database.createIndex("contests", "contest_by_elo_state", "elo_applied");

    log("Done");
};
