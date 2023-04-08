import { ContestMemberV2, ExamFinalSubmissionV2, SubmissionV5 } from "@kontestis/models";
import { eqIn, Migration } from "scyllo";

import { Database } from "../Database";

type MigrationType = {
    contest_members: ContestMemberV2;
    exam_final_submissions: ExamFinalSubmissionV2;
    submissions: SubmissionV5;
};

export const migration_add_exam_scores_to_contest_member: Migration<MigrationType> = async (
    database,
    log
) => {
    await database.raw("ALTER TABLE contest_members ADD exam_score map<text, int>");

    const members = await database.selectFrom("contest_members", "*", {});

    for (const member of members) {
        const examScore: Record<string, number> = {};

        const finalSubmissions = await database.selectFrom("exam_final_submissions", "*", {
            contest_id: member.contest_id,
            user_id: member.user_id,
        });

        const submissions = await database.selectFrom("submissions", ["id", "problem_id"], {
            id: eqIn(...finalSubmissions.map((finalSubmission) => finalSubmission.submission_id)),
        });

        for (const finalSubmission of finalSubmissions) {
            examScore[
                submissions
                    .find((submission) => submission.id === finalSubmission.submission_id)!
                    .problem_id.toString()
            ] = finalSubmission.final_score;
        }

        await Database.update(
            "contest_members",
            {
                exam_score: examScore,
            },
            {
                id: member.id,
                contest_id: member.contest_id,
                user_id: member.user_id,
            }
        );
    }

    log("Done");
};
