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

export type Contest = ContestV2;

export type ContestWithRegistrationStatus = Contest & {
    registered: boolean;
};
