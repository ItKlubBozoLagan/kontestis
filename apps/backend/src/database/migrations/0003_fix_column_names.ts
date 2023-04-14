import { ClusterSubmissionV1, ClusterSubmissionV2 } from "@kontestis/models";
import { SubmissionV1, SubmissionV2 } from "@kontestis/models";
import { TestcaseV1, TestcaseV2 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    submissions: SubmissionV2 & SubmissionV1;
    cluster_submissions: ClusterSubmissionV2 & ClusterSubmissionV1;
    testcases: TestcaseV2 & TestcaseV1;
};

export const migration_fix_column_names: Migration<MigrationType> = async (database, log) => {
    const testcases: TestcaseV1[] = await database.selectFrom("testcases", "*");
    const submissions: SubmissionV1[] = await database.selectFrom("submissions", "*");
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
        testcases.map((testcase) =>
            database.update(
                "testcases",
                {
                    correct_output: testcase.correctoutput,
                },
                { id: testcase.id }
            )
        )
    );

    await Promise.all(
        submissions.map((submission) =>
            database.update(
                "submissions",
                {
                    awarded_score: submission.awardedscore,
                },
                { id: submission.id }
            )
        )
    );

    await Promise.all(
        clusterSubmissions.map((submission) =>
            database.update(
                "cluster_submissions",
                {
                    awarded_score: submission.awardedscore,
                },
                { id: submission.id }
            )
        )
    );

    log("Done");
};
