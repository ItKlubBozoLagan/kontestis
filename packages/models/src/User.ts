import { PermissionData } from "permissio";

import { Snowflake } from "./Snowflake";

export type UserV1 = {
    id: Snowflake;
    username: string;
    password: string;
    email: string;
    permissions: PermissionData;
};

export type User = UserV1;

export type PasswordlessUser = Omit<User, "password">;
