import { Snowflake } from "../lib/snowflake";

export type UserV1 = {
    id: Snowflake;
    username: string;
    password: string;
    email: string;
    permissions: bigint;
};

export type User = UserV1;
