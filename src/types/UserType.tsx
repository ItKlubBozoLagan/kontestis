import { Snowflake } from "../pages/contests/Contests";

export type UserType = {
    id: Snowflake;
    username: string;
    password: string;
    email: string;
    permissions: number;
};
