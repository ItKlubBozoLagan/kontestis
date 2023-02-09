import { SubmissionV5 } from "@kontestis/models";
import { Migration } from "scyllo";

import { Database } from "../Database";

type MigrationType = {
    submissions: SubmissionV5;
};

export const migration_add_error_to_submission: Migration<MigrationType> = async (
    database,
    log
) => {
    await Database.raw("ALTER TABLE submissions ADD error text");

    log("Done");
};
