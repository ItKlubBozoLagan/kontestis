import { ContestMemberV1 } from "@kontestis/models";
import { SubmissionV3 } from "@kontestis/models";
import { Migration } from "scyllo";

import { getSnowflakeTime } from "../../lib/snowflake";

type MigrationType = {
    submissions: SubmissionV3;
    contest_members: ContestMemberV1;
};

export const migration_running_contest_preparation: Migration<
    MigrationType
> = async (database, log) => {
    const submissions = await database.selectFrom("submissions", "*");

    await database.raw("ALTER TABLE submissions ADD created_at date");

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
        "id"
    );

    await database.createIndex(
        "contest_members",
        "contest_members_by_contest_id",
        "contest_id"
    );
    await database.createIndex(
        "contest_members",
        "contest_members_by_user_id",
        "user_id"
    );

    await Promise.all(
        submissions.map((s) =>
            database.update(
                "submissions",
                {
                    created_at: getSnowflakeTime(s.id),
                },
                { id: s.id }
            )
        )
    );

    log("Done");
};
