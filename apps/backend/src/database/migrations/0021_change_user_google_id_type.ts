import { KnownUserDataV1, UserV3, UserV4 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    users: UserV4 & UserV3;
    known_users: KnownUserDataV1;
};

export const migration_change_user_google_id_type: Migration<MigrationType> = async (
    database,
    log
) => {
    await database.dropTable("users");
    await database.raw("TRUNCATE TABLE known_users");

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
