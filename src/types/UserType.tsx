import { Snowflake } from "../pages/contests/Contests";

export type UserType = {
    id: Snowflake;
    username: string;
    email: string;
    permissions: bigint;
};
