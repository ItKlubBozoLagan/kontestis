import { ContestMemberV1 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    contest_members: ContestMemberV1;
};

export const migration_contest_member_indices: Migration<MigrationType> = async (database, log) => {
    await database.createIndex("contest_members", "contest_members_by_contest_id", "contest_id");
    await database.createIndex("contest_members", "contest_members_by_user_id", "user_id");

    log("Done");
};
