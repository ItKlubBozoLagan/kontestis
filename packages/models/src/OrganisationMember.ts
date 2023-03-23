import { Snowflake } from "./Snowflake";

export type OrganisationMemberV1 = {
    id: Snowflake;
    user_id: Snowflake;
    organisation_id: Snowflake;
};

export type OrganisationMember = OrganisationMemberV1;
