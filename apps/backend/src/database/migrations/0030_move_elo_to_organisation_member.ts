import {
    DEFAULT_ELO,
    OrganisationMemberV1,
    OrganisationMemberV2,
    UserV4,
    UserV5,
} from "@kontestis/models";
import { Migration } from "scyllo";

import { DEFAULT_ORGANISATION } from "../../extractors/extractOrganisation";
import { generateSnowflake } from "../../lib/snowflake";

type MigrationType = {
    users: UserV4 | UserV5;
    organisation_members: OrganisationMemberV1 | OrganisationMemberV2;
};

export const migration_move_elo_to_organisation_member: Migration<MigrationType> = async (
    database,
    log
) => {
    await database.raw("ALTER TABLE organisation_members ADD elo int");

    const users = (await database.selectFrom("users", "*", {})) as UserV4[];

    await database.raw("ALTER TABLE users DROP elo");

    const organisationMembers = await database.selectFrom("organisation_members", "*", {});

    for (const organisationMember of organisationMembers) {
        await database.update(
            "organisation_members",
            { elo: DEFAULT_ELO },
            {
                id: organisationMember.id,
                user_id: organisationMember.user_id,
                organisation_id: organisationMember.organisation_id,
            }
        );
    }

    for (const user of users) {
        const currentOrganisationMember = await database.selectOneFrom(
            "organisation_members",
            "*",
            {
                organisation_id: DEFAULT_ORGANISATION.id,
                user_id: user.id,
            }
        );

        if (currentOrganisationMember) {
            await database.update(
                "organisation_members",
                {
                    elo: user.elo,
                },
                {
                    id: currentOrganisationMember.id,
                    user_id: currentOrganisationMember.user_id,
                    organisation_id: currentOrganisationMember.organisation_id,
                }
            );
            continue;
        }

        await database.insertInto("organisation_members", {
            id: generateSnowflake(),
            user_id: user.id,
            organisation_id: DEFAULT_ORGANISATION.id,
            elo: user.elo,
        });
    }

    log("Done");
};
