import { Snowflake } from "./Snowflake";
import { Verdict } from "./SubmissionType";

export type TestcaseSubmission = {
    id: Snowflake;
    testcase_id: Snowflake;
    cluster_submission_id: Snowflake;

    verdict: Verdict;
    awarded_score: number;

    time_used_millis: number;
    memory_used_megabytes: number;
};
