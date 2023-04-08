import { ExamFinalSubmissionV3 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    exam_final_submissions: ExamFinalSubmissionV3;
};

export const migration_add_reviewed_to_exam_final_submissions: Migration<MigrationType> = async (
    database,
    log
) => {
    await database.raw("ALTER TABLE exam_final_submissions ADD reviewed boolean");

    const finalSubmissions = await database.selectFrom("exam_final_submissions", "*", {});

    for (const finalSubmission of finalSubmissions) {
        await database.update(
            "exam_final_submissions",
            {
                reviewed: false,
            },
            {
                id: finalSubmission.id,
                user_id: finalSubmission.user_id,
                contest_id: finalSubmission.contest_id,
            }
        );
    }

    log("Done");
};
