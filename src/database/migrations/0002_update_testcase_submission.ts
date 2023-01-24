import { Migration } from "scyllo";

import { ClusterSubmissionV1 } from "../../types/ClusterSubmission";
import { TestcaseV1 } from "../../types/Testcase";
import {
    TestcaseSubmissionV1,
    TestcaseSubmissionV2,
} from "../../types/TestcaseSubmission";

type MigrationType = {
    testcase: TestcaseV1;
    cluster_submissions: ClusterSubmissionV1;
    testcase_submissions: TestcaseSubmissionV1 & TestcaseSubmissionV2;
};

export const migration_update_testcase_submission: Migration<
    MigrationType
> = async (database, log) => {
    const testcaseSubmissionData = await database.selectFrom(
        "testcase_submissions",
        "*"
    );
    const testcaseData = await database.selectFrom("testcase", "*");
    const clusterSubmissionData = await database.selectFrom(
        "cluster_submissions",
        "*"
    );

    await database.raw("ALTER TABLE testcase_submissions DROP submission_id");
    await database.raw(
        "ALTER TABLE testcase_submissions ADD cluster_submission_id bigint"
    );

    const batch = database.batch();

    for (const it of testcaseSubmissionData) {
        batch.update(
            "testcase_submissions",
            {
                cluster_submission_id:
                    clusterSubmissionData.find(
                        (cs) =>
                            cs.cluster_id ===
                            (testcaseData.find((t) => t.id === it.testcase_id)
                                ?.cluster_id ?? 0n)
                    )?.id ?? 0n,
                awarded_score: it.awardedscore,
            },
            { id: it.id }
        );
    }

    await batch.execute();
    log("Done");
};
