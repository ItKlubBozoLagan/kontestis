import { PermissionData } from "permissio";

import { Snowflake } from "./Snowflake";

export type ContestV1 = {
    id: Snowflake;
    admin_id: Snowflake;
    name: string;
    start_time: Date;
    duration_seconds: number;
    public: boolean;
};

export type ContestV2 = ContestV1 & {
    elo_applied: boolean;
};

export type ContestV3 = ContestV2 & {
    official: boolean;
};

export type Contest = ContestV3;

export type ContestWithPermissions = Contest & {
    registered: boolean;
    permissions: PermissionData;
};
