import { PermissionData } from "permissio";

import { Snowflake } from "./Snowflake";

export type OrganisationMemberV1 = {
    id: Snowflake;
    user_id: Snowflake;
    organisation_id: Snowflake;
};

export type OrganisationMemberV2 = OrganisationMemberV1 & {
    elo: number;
};

export type OrganisationMemberV3 = OrganisationMemberV2 & {
    permissions: PermissionData;
};

export type OrganisationMember = OrganisationMemberV3;

export type OrganisationMemberWithInfo = OrganisationMember & {
    email_domain: string;
    full_name: string;
};
