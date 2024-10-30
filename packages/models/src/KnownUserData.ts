import { Snowflake } from "./Snowflake";

// stores last know data since user login
// used for fetching data when not the actual user
export type KnownUserDataV1 = {
    user_id: Snowflake;
    full_name: string;
    email: string;
    picture_url: string;
};
