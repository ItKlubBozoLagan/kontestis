import { Snowflake } from "./Snowflake";

export type ContestV1 = {
    id: Snowflake;
    admin_id: Snowflake;
    name: string;
    start_time: Date;
    duration_seconds: number;
    public: boolean;
};

export type Contest = ContestV1;

export type ContestWithRegistrationStatus = Contest & {
    registered: boolean;
};
