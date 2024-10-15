import { OrganisationMemberV3, OrganisationPermissions, OrganisationV1 } from "@kontestis/models";
import { EMPTY_PERMISSIONS, grantPermission } from "permissio";
import { Migration } from "scyllo";

import { Database } from "../Database";

type MigrationType = {
    organisation_members: OrganisationMemberV3;
    organisations: OrganisationV1;
};

export const migration_add_organisations_permissions: Migration<MigrationType> = async (
    database,
    log
) => {
    await database.raw("ALTER TABLE organisation_members ADD permissions BIGINT");

    const organisationMembers = await database.selectFrom("organisation_members", "*", {});

    const organisations = await database.selectFrom("organisations", "*", {});

    const organisationsById: Record<string, OrganisationV1> = {};

    for (const organisation of organisations) {
        organisationsById[organisation.id.toString()] = organisation;
    }

    for (const organisationMember of organisationMembers) {
        const organisation = organisationsById[organisationMember.organisation_id.toString()];

        await Database.update(
            "organisation_members",
            {
                permissions:
                    organisationMember.id === organisation?.owner
                        ? grantPermission(EMPTY_PERMISSIONS, OrganisationPermissions.ADMIN)
                        : EMPTY_PERMISSIONS,
            },
            {
                id: organisationMember.id,
                user_id: organisationMember.user_id,
                organisation_id: organisationMember.organisation_id,
            }
        );
    }

    log("Done");
};
