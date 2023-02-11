import { ContestQuestionV1 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    contest_questions: ContestQuestionV1;
};

export const migration_contest_questions: Migration<MigrationType> = async (database, log) => {
    await database.createTable(
        "contest_questions",
        true,
        {
            id: { type: "bigint" },
            contest_member_id: { type: "bigint" },
            contest_id: { type: "bigint" },
            question: { type: "text" },
            response_author_id: { type: "bigint" },
            response: { type: "text" },
        },
        "id"
    );

    await database.createIndex(
        "contest_questions",
        "contest_questions_by_contest_member_id",
        "contest_member_id"
    );

    await database.createIndex(
        "contest_questions",
        "contest_questions_by_response_author_id",
        "response_author_id"
    );

    log("Done");
};
