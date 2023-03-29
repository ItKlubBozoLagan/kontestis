import { ExamFinalSubmissionV1 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    exam_final_submissions: ExamFinalSubmissionV1;
};

export const migration_add_exam_final_submissions_index: Migration<MigrationType> = async (
    database,
    log
) => {
    await database.createIndex(
        "exam_final_submissions",
        "exam_final_submissions_by_submission_id",
        "submission_id"
    );

    log("Done");
};
