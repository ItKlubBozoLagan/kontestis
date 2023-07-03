import { ContestV6 } from "@kontestis/models";
import { Migration } from "scyllo";

import { randomSequence } from "../../utils/random";

type MigrationType = {
    contests: ContestV6;
};

export const migration_add_join_codes: Migration<MigrationType> = async (database, log) => {
    await database.raw("ALTER TABLE contests ADD join_code text");

    const contests = await database.selectFrom("contests", ["id"], {});

    for (const contest of contests) {
        await database.update("contests", { join_code: randomSequence(8) }, { id: contest.id });
    }

    await database.createIndex("contests", "contests_by_join_code", "join_code");

    log("Done");
};
