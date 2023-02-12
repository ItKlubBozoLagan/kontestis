import { ContestV2 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    contests: ContestV2;
};

export const migration_apply_elo_state: Migration<MigrationType> = async (database, log) => {
    await database.raw("ALTER TABLE contests ADD elo_applied boolean");

    log("Done");
};
