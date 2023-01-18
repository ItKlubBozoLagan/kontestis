import { Snowflake } from "../lib/snowflake";

export type Verdict =
    | "accepted"
    | "wrong_answer"
    | "time_limit_exceeded"
    | "memory_limit_exceeded"
    | "runtime_error"
    | "compile_error";

export type EvaluationLanguage = "c" | "cpp" | "python";

export type Submission = {
    id: Snowflake;
    user_id: Snowflake;
    problem_id: Snowflake;
    language: EvaluationLanguage;
    code: string;

    verdict?: Verdict;
    awardedScore?: number;

    time_used_millis?: number;
    memory_used_megabytes?: number;

    completed: boolean;
};
