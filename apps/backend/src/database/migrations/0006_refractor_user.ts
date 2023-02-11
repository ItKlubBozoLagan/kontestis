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
            google_id: { type: "bigint" }, // TODO: please don't use this for anything, google is insane and it's ids are > 64bits
            permissions: { type: "bigint" },
        },
        "id",
        ["google_id"]
    );

    log("Done");
};
