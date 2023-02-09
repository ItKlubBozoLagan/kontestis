import { KnownUserDataV1 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    known_users: KnownUserDataV1;
};

export const migration_known_user_data: Migration<MigrationType> = async (
    database,
    log
) => {
    await database.createTable(
        "known_users",
        true,
        {
            user_id: { type: "bigint" },
            email: { type: "text" },
            full_name: { type: "text" },
            picture_url: { type: "text" },
        },
        "user_id"
    );

    log("Done");
};
