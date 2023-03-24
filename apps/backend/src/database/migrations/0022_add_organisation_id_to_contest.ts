import { ContestV4 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    contests: ContestV4;
};

export const migration_add_organisation_id_to_contest: Migration<MigrationType> = async (
    database,
    log
) => {
    await database.raw("ALTER TABLE contests ADD organisation_id BIGINT");

    const contests = await database.selectFrom("contests", ["id"], {});

    for (const c of contests) {
        await database.update("contests", { organisation_id: 1n }, { id: c.id });
    }

    log("Done");
};
