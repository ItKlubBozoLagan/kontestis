import {Snowflake} from "../lib/snowflake";


export type AllowedUser = {
    user_id: Snowflake,
    allowed_id: Snowflake
}