import { ManagedUserV1 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    managed_users: ManagedUserV1;
};

export const migration_add_managed_users: Migration<MigrationType> = async (database, log) => {
    await database.createTable(
        "managed_users",
        true,
        {
            id: {
                type: "bigint",
            },
            email: {
                type: "text",
            },
            password: {
                type: "text",
            },
            created_at: { type: "timestamp" },
            confirmed_at: { type: "timestamp" },
        },
        "id"
    );

    await database.createIndex("managed_users", "managed_users_by_email", "email");

    log("Done");
};
