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

export type Cluster = ClusterV2;
