import { ProblemV3 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    problems: ProblemV3;
};

export const migration_add_tags_to_problems: Migration<MigrationType> = async (database, log) => {
    await database.raw("ALTER TABLE problems ADD tags set<text>");

    log("Done");
};
