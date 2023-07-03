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

export type ContestV4 = ContestV3 & {
    organisation_id: Snowflake;
};

export type ContestV5 = ContestV4 & {
    exam: boolean;
};

export type ContestV6 = ContestV5 & {
    join_code: string;
};

export type Contest = ContestV6;

export type ContestWithPermissions = Contest & {
    registered: boolean;
    permissions: PermissionData;
};
