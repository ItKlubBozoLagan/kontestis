import { EvaluationLanguage } from "./Evaluation";
import { Snowflake } from "./Snowflake";
import { GeneratorState } from "./Testcase";

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
    order_number: bigint;
    status: GeneratorState;
    error?: string;
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
