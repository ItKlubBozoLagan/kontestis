import {Snowflake} from "../lib/snowflake";

export type EvaluationVariant = "plain" | "script" | "interactive";

export type Problem = {
    id: Snowflake,
    contest_id: Snowflake,
    title: string,
    description: string,

    evaluation_variant: EvaluationVariant,
    evaluation_script?: string,

    time_limit_millis: number,
    memory_limit_megabytes: number
}