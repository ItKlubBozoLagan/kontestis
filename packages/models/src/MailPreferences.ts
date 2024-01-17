import { Snowflake } from "./Snowflake";

export type MailPreferenceV1 = {
    user_id: Snowflake;
    status: "all" | "contest-only" | "none";
    code: string;
};

export type MailPreference = MailPreferenceV1;
