import { Snowflake } from "./Snowflake";

export type UserType = {
    id: Snowflake;
    username: string;
    email: string;
    permissions: bigint;
};
