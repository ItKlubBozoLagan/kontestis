import { ContestV4, OrganisationMemberV1, OrganisationV1 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    organisations: OrganisationV1;
    organisation_members: OrganisationMemberV1;
    contests: ContestV4;
};

export const migration_organisation_indexes: Migration<MigrationType> = async (database, log) => {
    await database.createIndex("organisations", "organisations_by_name", "name");
    await database.createIndex("contests", "contests_by_organisation_id", "organisation_id");
    await database.createIndex(
        "organisation_members",
        "organisation_members_by_user_id",
        "user_id"
    );
    await database.createIndex(
        "organisation_members",
        "organisation_members_by_organisation_id",
        "organisation_id"
    );

    log("Done");
};
