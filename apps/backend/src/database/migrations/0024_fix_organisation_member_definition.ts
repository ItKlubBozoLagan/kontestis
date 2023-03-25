import { OrganisationMemberV1 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    organisation_members: OrganisationMemberV1;
};

export const migration_fix_organisation_member_definition: Migration<MigrationType> = async (
    database,
    log
) => {
    const allMembers = await database.selectFrom("organisation_members", "*");

    await Promise.all([
        database.raw("DROP INDEX IF EXISTS organisation_members_by_user_id"),
        database.raw("DROP INDEX IF EXISTS organisation_members_by_organisation_id"),
    ]);

    await database.dropTable("organisation_members");

    await database.createTable(
        "organisation_members",
        true,
        {
            id: { type: "bigint" },
            user_id: { type: "bigint" },
            organisation_id: { type: "bigint" },
        },
        "id",
        ["user_id", "organisation_id"]
    );

    await Promise.all(
        allMembers.map((member) => database.insertInto("organisation_members", member))
    );

    log("Done");
};
