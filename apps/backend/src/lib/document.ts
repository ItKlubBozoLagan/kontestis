import { ProblemWithScore, Snowflake, Submission } from "@kontestis/models";
import { toCroatianLocale } from "@kontestis/utils";
import {
    AlignmentType,
    BorderStyle,
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    TextRun,
} from "docx";
import { StatusCodes } from "http-status-codes";
import * as R from "remeda";
import { eqIn } from "scyllo";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";

export const parseMultiLine = (lines: string) =>
    lines.split("\n").map((line) => new TextRun({ break: 1, text: line }));

export const generateDocument = async (contestId: Snowflake, userId: Snowflake) => {
    const contest = await Database.selectOneFrom("contests", "*", { id: contestId });

    if (!contest) throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);

    const gradingScale = await Database.selectFrom("exam_grading_scales", "*", {
        contest_id: contest.id,
    });

    const problems = (await Database.selectFrom("problems", "*", { contest_id: contest.id })).sort(
        (a, b) => Number(a.id) - Number(b.id)
    );

    const problemsWithScore: ProblemWithScore[] = await Promise.all(
        problems.map(async (problem) => {
            const clusters = await Database.selectFrom("clusters", "*", {
                problem_id: problem.id,
            });
            const score = clusters.reduce(
                (accumulator, current) => accumulator + current.awarded_score,
                0
            );

            return R.addProp(problem, "score", score);
        })
    );

    const userInfo = await Database.selectOneFrom("known_users", "*", { user_id: userId });

    if (!userInfo) throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);

    const finalSubmissions = await Database.selectFrom("exam_final_submissions", "*", {
        user_id: userId,
        contest_id: contestId,
    });

    const submissions = (await Database.selectFrom("submissions", "*", {
        id: eqIn(...finalSubmissions.map((fs) => fs.submission_id)),
    })) as Submission[];

    const submissionsByProblemId: Record<string, Submission> = {};

    for (const s of submissions) submissionsByProblemId[s.problem_id.toString()] = s;

    const score = submissions.reduce((a, s) => a + s.awarded_score, 0);

    const totalScore = problemsWithScore.reduce((a, p) => a + p.score, 0);

    const percentage = (score / totalScore) * 100;

    const grade = gradingScale
        .sort((a, b) => b.percentage - a.percentage)
        .find((s) => percentage ?? 0 >= s.percentage);

    const problemData = problemsWithScore.flatMap((p) => [
        new Paragraph({
            text: p.title,
            heading: HeadingLevel.HEADING_3,
            border: { top: { style: BorderStyle.DOTTED, space: 10 } },
        }),
        new Paragraph({
            text: (submissionsByProblemId[p.id.toString()]?.awarded_score ?? 0) + "/" + p.score,
            heading: HeadingLevel.HEADING_3,
            alignment: AlignmentType.RIGHT,
        }),
        new Paragraph({
            children: parseMultiLine(
                submissionsByProblemId[p.id.toString()]
                    ? Buffer.from(submissionsByProblemId[p.id.toString()].code, "base64").toString(
                          "utf8"
                      )
                    : "-------"
            ),
            border: { bottom: { style: BorderStyle.DOTTED, space: 10 } },
        }),
    ]);

    const document = new Document({
        sections: [
            {
                children: [
                    new Paragraph({
                        text: contest.name + " - " + toCroatianLocale(contest.start_time, true),
                        heading: HeadingLevel.HEADING_1,
                    }),
                    new Paragraph({
                        text: userInfo.full_name + " (" + userInfo.email + ")",
                        heading: HeadingLevel.HEADING_2,
                    }),
                    new Paragraph({
                        text: score + "/" + totalScore,
                        heading: HeadingLevel.HEADING_2,
                    }),
                    new Paragraph({
                        text: grade?.grade ?? "",
                        heading: HeadingLevel.HEADING_2,
                    }),
                    ...problemData,
                    new Paragraph({
                        // TODO: Internationalisation
                        text: "Potpis: ________________________",
                        alignment: AlignmentType.RIGHT,
                    }),
                ],
            },
        ],
    });

    return await Packer.toBuffer(document);
};
