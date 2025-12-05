import { TestcaseV4 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    testcases: TestcaseV4;
};

export const migration_generator_id_index: Migration<MigrationType> = async (database, log) => {
    await database.createIndex("testcases", "testcases_by_generator_id", "generator_id");

    log("Done");
};
