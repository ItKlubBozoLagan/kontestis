import {Snowflake} from "../lib/snowflake";

export type Contest = {
    id: Snowflake,
    name: string,
    start_time: Date,
    duration_seconds: number
}