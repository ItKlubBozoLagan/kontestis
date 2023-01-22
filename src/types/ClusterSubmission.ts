import { Snowflake } from "../lib/snowflake";
import { Verdict } from "./Submission";

export type ClusterSubmissionV1 = {
    id: Snowflake;
    submission_id: Snowflake;
    cluster_id: Snowflake;

    verdict: Verdict;
    awardedscore: number;

    time_used_millis: number;
    memory_used_megabytes: number;
};

export type ClusterSubmission = ClusterSubmissionV1;
