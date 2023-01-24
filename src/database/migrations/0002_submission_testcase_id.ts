import { Migration } from "scyllo";

import { Database } from "../Database";

export const migration_submission_testcase_id: Migration<never> = async (
    database,
    log
) => {
    await Database.deleteFrom("testcase_submissions", "*", {});

    log("Done");
};
