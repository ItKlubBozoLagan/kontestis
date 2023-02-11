import { ContestMemberV1 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    contest_members: ContestMemberV1;
};

export const migration_fix_contest_member_definition: Migration<MigrationType> = async (
    database,
    log
) => {
    const allMembers = await database.selectFrom("contest_members", "*");

    await database.dropTable("contest_members");

    await database.createTable(
        "contest_members",
        true,
        {
            id: { type: "bigint" },
            user_id: { type: "bigint" },
            contest_id: { type: "bigint" },
            contest_permissions: { type: "bigint" },
            score: { type: "map", keyType: "bigint", valueType: "int" },
        },
        "id",
        ["contest_id", "user_id"]
    );

    await Promise.all(allMembers.map((member) => database.insertInto("contest_members", member)));

    log("Done");
};
