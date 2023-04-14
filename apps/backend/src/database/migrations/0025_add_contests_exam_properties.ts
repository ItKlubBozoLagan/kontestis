import { ContestV5 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    contests: ContestV5;
};

export const migration_add_contests_exam_properties: Migration<MigrationType> = async (
    database,
    log
) => {
    await database.raw("ALTER TABLE contests ADD exam boolean");

    const contests = await database.selectFrom("contests", ["id"], {});

    for (const contest of contests) {
        await database.update("contests", { exam: false }, { id: contest.id });
    }

    log("Done");
};
