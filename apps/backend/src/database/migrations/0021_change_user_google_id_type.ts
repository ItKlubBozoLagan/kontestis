import { UserV3, UserV4 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    users: UserV4 & UserV3;
};

export const migration_change_user_google_id_type: Migration<MigrationType> = async (
    database,
    log
) => {
    await database.dropTable("users");

    await database.createTable(
        "users",
        false,
        {
            id: { type: "bigint" },
            google_id: { type: "text" },
            permissions: { type: "bigint" },
            elo: { type: "int" },
        },
        "id",
        ["google_id"]
    );

    log("Done");
};
