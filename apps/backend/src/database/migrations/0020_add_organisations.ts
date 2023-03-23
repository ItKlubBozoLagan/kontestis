import { OrganisationMemberV1, OrganisationV1 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    organisations: OrganisationV1;
    organisation_members: OrganisationMemberV1;
};

export const migration_add_organisations: Migration<MigrationType> = async (database, log) => {
    await database.createTable(
        "organisations",
        true,
        {
            id: { type: "bigint" },
            owner: { type: "bigint" },
            name: { type: "text" },
            avatar_url: { type: "text" },
        },
        "id"
    );

    await database.createTable(
        "organisation_members",
        true,
        {
            id: { type: "bigint" },
            user_id: { type: "bigint" },
            organisation_id: { type: "bigint" },
        },
        "id"
    );

    log("Done");
};
