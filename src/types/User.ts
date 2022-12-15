import { Snowflake } from "../lib/snowflake";

export type User = {
    user_id: Snowflake;
    username: string;
    password: string;
    email: string;
    permissions: number;
}
