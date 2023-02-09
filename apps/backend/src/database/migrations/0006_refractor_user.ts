import { UserV2 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    users: UserV2;
};

export const migration_refractor_user: Migration<MigrationType> = async (database, log) => {
    await database.dropTable("users");

    await database.createTable(
        "users",
        true,
        {
            id: { type: "bigint" },
            google_id: { type: "bigint" },
            permissions: { type: "bigint" },
        },
        "id",
        ["google_id"]
    );

    log("Done");
};
