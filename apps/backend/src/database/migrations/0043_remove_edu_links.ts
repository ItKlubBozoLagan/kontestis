import { EduUserLinksV1 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    edu_user_links: EduUserLinksV1;
};

export const migration_remove_edu_links: Migration<MigrationType> = async (database, log) => {
    await database.dropTable("edu_user_links");

    log("Done");
};
