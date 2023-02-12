import { DEFAULT_ELO, UserV3 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    users: UserV3;
};

export const migration_add_elo_to_user: Migration<MigrationType> = async (database, log) => {
    await database.raw("ALTER TABLE users ADD elo INT");
    const users = await database.selectFrom("users", "*", {});

    for (const user of users) {
        await database.update(
            "users",
            { elo: DEFAULT_ELO },
            { id: user.id, google_id: user.google_id }
        );
    }
    log("Done");
};
