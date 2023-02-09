import { EvaluationVerdict } from "./Evaluation";
import { Snowflake } from "./Snowflake";

export type TestcaseSubmissionV1 = {
    id: Snowflake;
    testcase_id: Snowflake;
    submission_id: Snowflake;

    verdict: EvaluationVerdict;
    awardedscore: number;

    time_used_millis: number;
    memory_used_megabytes: number;
};

export type TestcaseSubmissionV2 = Omit<TestcaseSubmissionV1, "submission_id" | "awardedscore"> & {
    cluster_submission_id: Snowflake;
    awarded_score: number;
};

export type TestcaseSubmission = TestcaseSubmissionV2;
