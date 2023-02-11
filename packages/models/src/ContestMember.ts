import type { PermissionData } from "permissio";

import { Snowflake } from "./Snowflake";

export type ContestMemberV1 = {
    id: Snowflake;
    user_id: Snowflake;
    contest_id: Snowflake;
    contest_permissions: PermissionData;
    score: Record<string, number>;
};

export type ContestMember = ContestMemberV1;
