import { Snowflake } from "../lib/snowflake";
import { Verdict } from "./Submission";

export type TestcaseSubmission = {
    id: Snowflake;
    testcase_id: Snowflake;
    submission_id: Snowflake;

    verdict: Verdict;
    awardedScore: number;

    time_used_millis: number;
    memory_used_megabytes: number;
};
