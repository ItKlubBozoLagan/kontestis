import { Snowflake } from "../pages/contests/Contests";
import { Verdict } from "./SubmissionType";

export type ClusterSubmissionType = {
    id: Snowflake;
    submission_id: Snowflake;
    cluster_id: Snowflake;

    verdict: Verdict;
    awardedscore: number;

    time_used_millis: number;
    memory_used_megabytes: number;
};
