import { Snowflake } from "../pages/contests/Contests";

export type ContestType = {
    id: Snowflake;
    admin_id: Snowflake;
    name: string;
    start_time: Date;
    duration_seconds: number;
    public: boolean;
};
