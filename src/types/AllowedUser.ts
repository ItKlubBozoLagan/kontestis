import { Snowflake } from "../lib/snowflake";

export type AllowedUser = {
    id: Snowflake;
    user_id: Snowflake;
    contest_id: Snowflake;
};
