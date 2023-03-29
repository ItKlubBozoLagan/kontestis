import { ExamFinalSubmissionV1 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    exam_final_submissions: ExamFinalSubmissionV1;
};

export const migration_add_exam_final_submissions: Migration<MigrationType> = async (
    database,
    log
) => {
    await database.createTable(
        "exam_final_submissions",
        true,
        {
            id: { type: "bigint" },
            contest_id: { type: "bigint" },
            user_id: { type: "bigint" },
            submission_id: { type: "bigint" },
        },
        "id",
        ["contest_id", "user_id"]
    );

    log("Done");
};
