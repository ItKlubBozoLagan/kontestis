import { PermissionData } from "permissio";

import { Snowflake } from "../lib/snowflake";

export type UserV1 = {
    id: Snowflake;
    username: string;
    password: string;
    email: string;
    permissions: PermissionData;
};

export type User = UserV1;
