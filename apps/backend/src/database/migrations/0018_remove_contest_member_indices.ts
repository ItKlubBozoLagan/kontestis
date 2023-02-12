import { ContestMember } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    contest_members: ContestMember;
};

export const migration_remove_contest_member_indices: Migration<MigrationType> = async (
    database,
    log
) => {
    await database.raw("DROP INDEX IF EXISTS contest_members_by_user_id");
    await database.raw("DROP INDEX IF EXISTS contest_members_by_contest_id");

    log("Done");
};
