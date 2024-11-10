import { EduUserV1 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    edu_users: EduUserV1;
};

export const migration_edu_user_uid_index: Migration<MigrationType> = async (database, log) => {
    await database.createIndex("edu_users", "edu_users_by_uid", "uid");

    log("Done");
};
