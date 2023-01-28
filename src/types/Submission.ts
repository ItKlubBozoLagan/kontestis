import { Snowflake } from "../lib/snowflake";

export type Verdict =
    | "accepted"
    | "wrong_answer"
    | "time_limit_exceeded"
    | "memory_limit_exceeded"
    | "runtime_error"
    | "compilation_error"
    | "evaluation_error";

export type EvaluationLanguage = "c" | "cpp" | "python";

export type SubmissionV1 = {
    id: Snowflake;
    user_id: Snowflake;
    problem_id: Snowflake;
    language: EvaluationLanguage;
    code: string;

    verdict?: Verdict;
    awardedscore?: number;

    time_used_millis?: number;
    memory_used_megabytes?: number;

    completed: boolean;
};

export type SubmissionV2 = Omit<SubmissionV1, "awardedscore"> & {
    awarded_score?: number;
};

export type Submission = SubmissionV2;
