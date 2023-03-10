import { Snowflake } from "./Snowflake";

export type ClusterV1 = {
    id: Snowflake;
    problem_id: Snowflake;
    awarded_score: number;
};

export type Cluster = ClusterV1;
