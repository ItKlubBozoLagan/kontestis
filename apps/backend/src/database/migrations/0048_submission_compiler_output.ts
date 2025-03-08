import { SubmissionV6 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    submissions: SubmissionV6;
};

export const migration_submission_compiler_output: Migration<MigrationType> = async (
    database,
    log
) => {
    await database.raw("ALTER TABLE submissions ADD compiler_output text");

    log("Done");
};
