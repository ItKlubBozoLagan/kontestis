import { ContestMemberV2 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    contest_members: ContestMemberV2;
};

export const migration_fix_contest_members_table: Migration<MigrationType> = async (
    database,
    log
) => {
    const contestMembers = await database.selectFrom("contest_members", "*");

    await database.dropTable("contest_members");

    await database.createTable(
        "contest_members",
        true,
        {
            id: { type: "bigint" },
            contest_id: { type: "bigint" },
            user_id: { type: "bigint" },
            contest_permissions: { type: "bigint" },
            score: { type: "map", keyType: "text", valueType: "int" },
            exam_score: { type: "map", keyType: "text", valueType: "int" },
        },
        "id",
        ["contest_id", "user_id"]
    );

    for (const contest_member of contestMembers) {
        await database.rawWithParams(
            `
      INSERT INTO contest_members (id, user_id, contest_id, contest_permissions, score, exam_score)
        VALUES (?, ?, ?, ?, ?, ?);
      `,
            [
                contest_member.id,
                contest_member.user_id,
                contest_member.contest_id,
                contest_member.contest_permissions,
                contest_member.score,
                contest_member.exam_score,
            ]
        );
    }
    log("Done");
};
