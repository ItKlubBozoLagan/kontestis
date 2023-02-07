import { EvaluationLanguage, EvaluationVerdict } from "./Evaluation";
import { Snowflake } from "./Snowflake";

export type SubmissionV1 = {
    id: Snowflake;
    user_id: Snowflake;
    problem_id: Snowflake;
    language: EvaluationLanguage;
    code: string;

    verdict?: EvaluationVerdict;
    awardedscore?: number;

    time_used_millis?: number;
    memory_used_megabytes?: number;

    completed: boolean;
};

export type SubmissionV2 = Omit<SubmissionV1, "awardedscore"> & {
    awarded_score?: number;
};

export type SubmissionV3 = SubmissionV2 & { created_at: Date };

export type Submission = SubmissionV3;
