import { Snowflake } from "../pages/contests/Contests";

export type ProblemType = {
    id: Snowflake;
    contest_id: Snowflake;
    title: string;
    description: string;

    time_limit_millis: number;
    memory_limit_megabytes: number;
};
