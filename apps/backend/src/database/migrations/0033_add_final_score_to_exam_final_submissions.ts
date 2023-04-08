import { ExamFinalSubmissionV2, SubmissionV5 } from "@kontestis/models";
import { eqIn, Migration } from "scyllo";

type MigrationType = {
    exam_final_submissions: ExamFinalSubmissionV2;
    submissions: SubmissionV5;
};

export const migration_add_final_score_to_exam_final_submissions: Migration<MigrationType> = async (
    database,
    log
) => {
    await database.raw("ALTER TABLE exam_final_submissions ADD final_score int");

    const finalSubmissions = await database.selectFrom("exam_final_submissions", "*", {});

    const submissions = await database.selectFrom("submissions", "*", {
        id: eqIn(...finalSubmissions.map((finalSubmission) => finalSubmission.submission_id)),
    });

    const submissionsScoresById: Record<string, number> = {};

    for (const submission of submissions) {
        submissionsScoresById[submission.id.toString()] = submission.awarded_score;
    }

    for (const finalSubmission of finalSubmissions) {
        await database.update(
            "exam_final_submissions",
            {
                final_score: submissionsScoresById[finalSubmission.submission_id.toString()] ?? 0,
            },
            {
                id: finalSubmission.id,
                contest_id: finalSubmission.contest_id,
                user_id: finalSubmission.user_id,
            }
        );
    }

    log("Done");
};
