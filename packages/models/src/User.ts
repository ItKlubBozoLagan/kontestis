import { PermissionData } from "permissio";

import { Snowflake } from "./Snowflake";

export type UserV1 = {
    id: Snowflake;
    username: string;
    password: string;
    email: string;
    permissions: PermissionData;
};

// we switched to Google auth
export type UserV2 = {
    id: Snowflake;
    google_id: Snowflake;
    permissions: PermissionData;
};

export const DEFAULT_ELO = 1000;

export type UserV3 = {
    id: Snowflake;
    google_id: Snowflake;
    permissions: PermissionData;
    elo: number;
};

export type User = UserV3;

export type FullUser = User & {
    full_name: string;
    email: string;
    picture_url: string;
};
