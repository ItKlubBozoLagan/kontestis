import { ContestV3 } from "@kontestis/models";
import { Migration } from "scyllo";

import { Database } from "../Database";

type MigrationType = {
    contests: ContestV3;
};

export const migration_add_official_to_contest: Migration<MigrationType> = async (
    database,
    log
) => {
    await Database.raw("ALTER TABLE contests ADD official boolean");

    log("Done");
};
