import {Snowflake} from "../lib/snowflake";

export type Problem = {
    id: Snowflake,
    contest_id: Snowflake,
    title: string,
    description: string,
    time_limit_millis: number,
    memory_limit_megabytes: number

}