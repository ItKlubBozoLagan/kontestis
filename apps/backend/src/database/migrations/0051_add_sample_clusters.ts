import { ClusterV3, ClusterV4, SubmissionV6, SubmissionV7 } from "@kontestis/models";
import { Migration } from "scyllo";

import { streamQuery } from "../streamQuery";

type MigrationType = {
    clusters: ClusterV3 & ClusterV4;
    submissions: SubmissionV6 & SubmissionV7;
};

export const migration_add_sample_clusters: Migration<MigrationType> = async (database, log) => {
    await database.raw("ALTER TABLE clusters ADD is_sample boolean");
    await database.raw("ALTER TABLE submissions ADD samples_passed boolean");

    const clusters = await database.selectFrom("clusters", ["id"], {});
    const submissions = await streamQuery<SubmissionV6>(
        database.client,
        "SELECT * FROM submissions"
    );

    for (const cluster of clusters) {
        await database.update(
            "clusters",
            {
                is_sample: false,
            },
            {
                id: cluster.id,
            }
        );
    }

    for (const submission of submissions) {
        await database.update(
            "submissions",
            {
                samples_passed: submission.verdict === "accepted",
            },
            {
                id: submission.id,
            }
        );
    }

    log("Done");
};
