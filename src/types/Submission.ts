import {Snowflake} from "../lib/snowflake";

export type Verdict = "AC" | "WA" | "TLE" | "MLE" | "RTE" | "CE";

export type EvaluationLang = "C" | "CPP" | "PY";

export type Submission = {
    id: Snowflake,
    user_id: Snowflake,
    problem_id: Snowflake,
    lang: EvaluationLang,
    code: string,

    verdict?: Verdict,
    awardedScore?: number,

    time_used_millis?: number,
    memory_used_megabytes?: number,

    completed: boolean,
}