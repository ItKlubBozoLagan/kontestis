import { Snowflake } from "./Snowflake";

export type ContestAnnouncementV1 = {
    id: Snowflake;
    contest_id: Snowflake;
    message: string;
};

export type ContestAnnouncement = ContestAnnouncementV1;
