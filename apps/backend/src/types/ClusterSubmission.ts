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

export type ClusterSubmissionV2 = Omit<ClusterSubmissionV1, "awardedscore"> & {
    awarded_score: number;
};

export type ClusterSubmission = ClusterSubmissionV2;
