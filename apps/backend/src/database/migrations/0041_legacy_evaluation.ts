import { ProblemV5 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    problems: ProblemV5;
};

export const migration_legacy_evaluation: Migration<MigrationType> = async (database, log) => {
    await database.raw("ALTER TABLE problems ADD legacy_evaluation boolean");

    const problems = await database.selectFrom("problems", ["id"]);

    for (const problem of problems) {
        await database.update(
            "problems",
            {
                legacy_evaluation: true,
            },
            {
                id: problem.id,
            }
        );
    }

    log("Done");
};
