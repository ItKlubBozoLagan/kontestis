import { ClusterSubmissionV1 } from "@kontestis/models";
import { TestcaseV1 } from "@kontestis/models";
import { TestcaseSubmissionV1, TestcaseSubmissionV2 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    testcases: TestcaseV1;
    cluster_submissions: ClusterSubmissionV1;
    testcase_submissions: TestcaseSubmissionV1 & TestcaseSubmissionV2;
};

export const migration_update_testcase_submission: Migration<MigrationType> = async (
    database,
    log
) => {
    const testcaseSubmissionData = await database.selectFrom("testcase_submissions", "*");

    const testcaseData = await database.selectFrom("testcases", "*");
    const clusterSubmissionData = await database.selectFrom("cluster_submissions", "*");

    await database.raw("DROP INDEX IF EXISTS testcase_submissions_by_submission_id");
    await database.raw("ALTER TABLE testcase_submissions DROP submission_id");
    await database.raw("ALTER TABLE testcase_submissions ADD cluster_submission_id bigint");

    await database.raw("ALTER TABLE testcase_submissions DROP awardedscore");
    await database.raw("ALTER TABLE testcase_submissions ADD awarded_score int");

    const batch = database.batch();

    for (const it of testcaseSubmissionData) {
        batch.update(
            "testcase_submissions",
            {
                cluster_submission_id:
                    clusterSubmissionData.find(
                        (cs) =>
                            cs.cluster_id ===
                            (testcaseData.find((t) => t.id === it.testcase_id)?.cluster_id ?? 0n)
                    )?.id ?? 0n,
                awarded_score: it.awardedscore,
            },
            { id: it.id }
        );
    }

    if (testcaseSubmissionData.length > 0) await batch.execute();

    await database.createIndex(
        "testcase_submissions",
        "testcase_submissions_by_cluster_submission_id",
        "cluster_submission_id"
    );

    log("Done");
};
