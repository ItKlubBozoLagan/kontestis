import {Snowflake} from "../lib/snowflake";

export type Contest = {
    id: Snowflake,
    admin_id: Snowflake,
    name: string,
    start_time: Date,
    duration_seconds: number,
    public: boolean,
}