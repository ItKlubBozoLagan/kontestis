import { ClusterV2, ProblemV2 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    problems: ProblemV2;
    clusters: ClusterV2;
};

export const migration_add_testcase_generators: Migration<MigrationType> = async (
    database,
    log
) => {
    await database.raw("ALTER TABLE clusters ADD generator boolean");
    await database.raw("ALTER TABLE clusters ADD generator_language text");
    await database.raw("ALTER TABLE clusters ADD generator_code text");

    await database.raw("ALTER TABLE problems ADD solution_language text");
    await database.raw("ALTER TABLE problems ADD solution_code text");

    const problems = await database.selectFrom("problems", ["id"], {});

    for (const problem of problems) {
        await database.update(
            "problems",
            { solution_language: "python", solution_code: "" },
            { id: problem.id }
        );
    }

    const clusters = await database.selectFrom("clusters", ["id"], {});

    for (const cluster of clusters) {
        await database.update("clusters", { generator: false }, { id: cluster.id });
    }

    log("Done");
};
