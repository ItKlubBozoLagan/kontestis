import { ContestQuestionV1 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    contest_questions: ContestQuestionV1;
};

export const migration_contest_questions_index: Migration<MigrationType> = async (
    database,
    log
) => {
    await database.createIndex(
        "contest_questions",
        "contest_questions_by_contest_id",
        "contest_id"
    );

    log("Done");
};
