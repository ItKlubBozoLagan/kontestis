import { EvaluationLanguage } from "./Evaluation";
import { Snowflake } from "./Snowflake";

export type ClusterV1 = {
    id: Snowflake;
    problem_id: Snowflake;
    awarded_score: number;
};

export type ClusterV2 = ClusterV1 & {
    generator: boolean;
    generator_language?: EvaluationLanguage;
    generator_code?: string;
};

export type ClusterV3 = ClusterV1 & {
    order: number;
    status:
        | "ready"
        | "ready-modified"
        | "not-ready"
        | "generator-error"
        | "validation-error"
        | "solution-error";
    mode: "auto" | "manual";
    error?: string;
    auto_generator_id?: Snowflake;
    auto_generator_tests: number;
};

export type ClusterStatus =
    | "cached"
    | "uncached"
    | "pending"
    | "generator_error"
    | "solution_error";

export type Cluster = ClusterV3;

export type ClusterWithStatus = Cluster & {
    status: ClusterStatus;
};
