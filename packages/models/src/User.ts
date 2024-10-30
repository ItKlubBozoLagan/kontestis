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

export type UserV4 = Omit<UserV3, "google_id"> & {
    google_id: string;
};

export type UserV5 = Omit<UserV4, "elo">;

export type UserV6 = Omit<UserV5, "google_id"> & {
    email: string;
    full_name: string;
    picture_url: string;
};

export type EduUserV1 = UserV6 & {
    uid: string;
    dob: Date;
    student_category: string;
    associated_org: string;
    professional_status: string;
};

export type EduUser = EduUserV1;

export type EduUserLinksV1 = {
    user_id: Snowflake;
    edu_uid: string;
};

export type EduUserLinks = EduUserLinksV1;

export type User = UserV6;
