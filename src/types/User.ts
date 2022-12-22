import { Snowflake } from "../lib/snowflake";

export type User = {
    id: Snowflake;
    username: string;
    password: string;
    email: string;
    permissions: number;
}
