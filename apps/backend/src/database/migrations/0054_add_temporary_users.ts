import { TemporaryUserV1 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    temporary_users: TemporaryUserV1;
};

export const migration_add_temporary_users: Migration<MigrationType> = async (database, log) => {
    await database.createTable(
        "temporary_users",
        true,
        {
            id: {
                type: "bigint",
            },
            username: {
                type: "text",
            },
            password: {
                type: "text",
            },
            organisation_id: {
                type: "bigint",
            },
            created_at: { type: "timestamp" },
        },
        "id"
    );

    await database.createIndex("temporary_users", "temporary_users_by_username", "username");

    log("Done");
};
