import {Snowflake} from "../lib/snowflake";

export type Cluster = {
    id: Snowflake,
    problem_id: Snowflake,
    awarded_score: number
}