import { PermissionData } from "permissio";

import { Snowflake } from "../lib/snowflake";

enum ContestPermissions {
    ADMIN,
    VIEW,
    VIEW_PRIVATE,
    EDIT,
    ADD_USER,
    REMOVE_USER,
    EDIT_USER_PERMISSIONS,
    VIEW_QUESTIONS,
    ANSWER_QUESTIONS,
}

export type ContestMemberV1 = {
    id: Snowflake;
    user_id: Snowflake;
    contest_id: Snowflake;
    contest_permissions: PermissionData;
    score: Map<Snowflake, number>;
};

export type ContestMember = ContestMemberV1;
