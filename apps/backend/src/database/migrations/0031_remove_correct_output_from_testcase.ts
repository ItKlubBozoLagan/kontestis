import { TestcaseV3 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    testcases: TestcaseV3;
};

export const migration_remove_correct_output_from_testcase: Migration<MigrationType> = async (
    database,
    log
) => {
    await database.raw("ALTER TABLE testcases DROP correct_output");

    log("Done");
};
