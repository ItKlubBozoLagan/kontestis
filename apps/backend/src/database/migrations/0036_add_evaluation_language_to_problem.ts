import { ProblemV4 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    problems: ProblemV4;
};

export const migration_add_evaluation_language_to_problem: Migration<MigrationType> = async (
    database,
    log
) => {
    await database.raw("ALTER TABLE problems ADD evaluation_language text");

    const problems = await database.selectFrom("problems", ["id"], {});

    for (const problem of problems) {
        await database.update(
            "problems",
            {
                evaluation_language: "python",
            },
            { id: problem.id }
        );
    }

    log("Done");
};
