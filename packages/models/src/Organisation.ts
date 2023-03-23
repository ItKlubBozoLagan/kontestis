import { Snowflake } from "./Snowflake";

export type OrganisationV1 = {
    id: Snowflake;
    owner: Snowflake;
    name: string;
    avatar_url: string;
};

export type Organisation = OrganisationV1;
