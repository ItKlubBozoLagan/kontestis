import {Snowflake} from "../lib/snowflake";

export type EvaluationVariant = "plain" | "script"

export type EvaluationSchema = {
    id: Snowflake,
    problem_id: Snowflake,
    variant: EvaluationVariant,
    script?: string

}