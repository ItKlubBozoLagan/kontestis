import { Snowflake } from "./Snowflake";

export type SiteNotificationType =
    | "contest-start"
    | "contest-end"
    | "new-question"
    | "question-answer"
    | "new-announcement"
    | "alert";

export type SiteNotificationV1 = {
    id: Snowflake;
    recipient: Snowflake;
    type: SiteNotificationType;
    data: string;
    seen: boolean;
    created_at: Date;
};

export type SiteNotification = SiteNotificationV1;
