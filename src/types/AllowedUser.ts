import { Snowflake } from "../lib/snowflake";

export type AllowedUserV1 = {
    id: Snowflake;
    user_id: Snowflake;
    contest_id: Snowflake;
};

export type AllowedUser = AllowedUserV1;
