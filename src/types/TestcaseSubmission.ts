import { Snowflake } from "../lib/snowflake";
import { Verdict } from "./Submission";

export type TestcaseSubmissionV1 = {
    id: Snowflake;
    testcase_id: Snowflake;
    submission_id: Snowflake;

    verdict: Verdict;
    awardedscore: number;

    time_used_millis: number;
    memory_used_megabytes: number;
};

export type TestcaseSubmissionV2 = {
    id: Snowflake;
    testcase_id: Snowflake;
    submission_cluster_id: Snowflake;

    verdict: Verdict;
    awardedscore: number;

    time_used_millis: number;
    memory_used_megabytes: number;
};

export type TestcaseSubmission = TestcaseSubmissionV2;
