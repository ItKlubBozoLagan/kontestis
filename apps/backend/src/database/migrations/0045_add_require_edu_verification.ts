import { ContestV7 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    contests: ContestV7;
};

export const migration_add_require_edu_verification: Migration<MigrationType> = async (
    database,
    log
) => {
    await database.raw("ALTER TABLE contests ADD require_edu_verification boolean");

    const contests = await database.selectFrom("contests", ["id"], {});

    for (const contest of contests) {
        await database.update("contests", { require_edu_verification: false }, { id: contest.id });
    }

    log("Done");
};
