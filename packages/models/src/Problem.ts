import { EvaluationLanguage, EvaluationVariant } from "./Evaluation";
import { Snowflake } from "./Snowflake";

export type ProblemV1 = {
    id: Snowflake;
    contest_id: Snowflake;
    title: string;
    description: string;

    evaluation_variant: EvaluationVariant;
    evaluation_script?: string;

    time_limit_millis: number;
    memory_limit_megabytes: number;
};

export type ProblemV2 = ProblemV1 & {
    solution_language: EvaluationLanguage;
    solution_code: string;
};

export type ProblemV3 = ProblemV2 & {
    tags: string[];
};

export type ProblemWithScore = Problem & {
    score: number;
};

export type Problem = ProblemV3;
