import { Migration } from "scyllo";

import {
    ClusterSubmissionV1,
    ClusterSubmissionV2,
} from "../../types/ClusterSubmission";
import { SubmissionV1, SubmissionV2 } from "../../types/Submission";
import { TestcaseV1, TestcaseV2 } from "../../types/Testcase";

type MigrationType = {
    submissions: SubmissionV2 & SubmissionV1;
    cluster_submissions: ClusterSubmissionV2 & ClusterSubmissionV1;
    testcases: TestcaseV2 & TestcaseV1;
};

export const migration_fix_column_names: Migration<MigrationType> = async (
    database,
    log
) => {
    const testcases: TestcaseV1[] = await database.selectFrom("testcases", "*");
    const submissions: SubmissionV1[] = await database.selectFrom(
        "submissions",
        "*"
    );
    const clusterSubmissions: ClusterSubmissionV1[] = await database.selectFrom(
        "cluster_submissions",
        "*"
    );

    await database.raw("ALTER TABLE testcases DROP correctoutput");
    await database.raw("ALTER TABLE testcases ADD correct_output text");

    await database.raw("ALTER TABLE submissions DROP awardedscore");
    await database.raw("ALTER TABLE submissions ADD awarded_score int");

    await database.raw("ALTER TABLE cluster_submissions DROP awardedscore");
    await database.raw("ALTER TABLE cluster_submissions ADD awarded_score int");

    await Promise.all(
        testcases.map((t) =>
            database.update(
                "testcases",
                {
                    correct_output: t.correctoutput,
                },
                { id: t.id }
            )
        )
    );

    await Promise.all(
        submissions.map((s) =>
            database.update(
                "submissions",
                {
                    awarded_score: s.awardedscore,
                },
                { id: s.id }
            )
        )
    );

    await Promise.all(
        clusterSubmissions.map((cs) =>
            database.update(
                "cluster_submissions",
                {
                    awarded_score: cs.awardedscore,
                },
                { id: cs.id }
            )
        )
    );

    log("Done");
};
