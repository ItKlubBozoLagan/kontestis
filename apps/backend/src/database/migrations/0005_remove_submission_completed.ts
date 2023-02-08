import { SubmissionV4 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    submissions: SubmissionV4;
};

export const migration_remove_submission_completed: Migration<
    MigrationType
> = async (database, log) => {
    await database.raw("ALTER TABLE submissions DROP completed");

    log("Done");
};
