import { Snowflake } from "./Snowflake";

export type OrganisationMemberV1 = {
    id: Snowflake;
    user_id: Snowflake;
    organisation_id: Snowflake;
};

export type OrganisationMemberV2 = OrganisationMemberV1 & {
    elo: number;
};

export type OrganisationMember = OrganisationMemberV2;

export type OrganisationMemberWithInfo = OrganisationMember & {
    full_name: string;
    email: string;
};
