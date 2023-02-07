import { EvaluationVerdict } from "./Evaluation";
import { Snowflake } from "./Snowflake";

export type ClusterSubmissionV1 = {
    id: Snowflake;
    submission_id: Snowflake;
    cluster_id: Snowflake;

    verdict: EvaluationVerdict;
    awardedscore: number;

    time_used_millis: number;
    memory_used_megabytes: number;
};

export type ClusterSubmissionV2 = Omit<ClusterSubmissionV1, "awardedscore"> & {
    awarded_score: number;
};

export type ClusterSubmission = ClusterSubmissionV2;
