import { AllowedUserV1 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    allowed_users: AllowedUserV1;
};

export const migration_remove_allowed_users: Migration<MigrationType> = async (database, log) => {
    await database.dropTable("allowed_users");

    log("Done");
};
