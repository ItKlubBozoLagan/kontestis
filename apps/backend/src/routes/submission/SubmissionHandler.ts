import {
    AdminPermissions,
    ContestMemberPermissions,
    ExamFinalSubmission,
    hasAdminPermission,
    hasContestPermission,
    Submission,
} from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { eqIn } from "scyllo";

import { Database } from "../../database/Database";
import { SafeError } from "../../errors/SafeError";
import { extractClusterSubmission } from "../../extractors/extractClusterSubmission";
import { extractContest } from "../../extractors/extractContest";
import { extractContestMember } from "../../extractors/extractContestMember";
import { extractFinalSubmission } from "../../extractors/extractFinalSubmission";
import { extractModifiableContest } from "../../extractors/extractModifiableContest";
import { extractOptionalUser } from "../../extractors/extractOptionalUser";
import { extractCurrentOrganisation } from "../../extractors/extractOrganisation";
import { extractProblem } from "../../extractors/extractProblem";
import { extractSubmission } from "../../extractors/extractSubmission";
import { extractUser } from "../../extractors/extractUser";
import { Influx } from "../../influx/Influx";
import { createInfluxUInt } from "../../influx/InfluxClient";
import { beginEvaluation } from "../../lib/evaluation";
import { getAllPendingSubmissions } from "../../lib/pendingSubmission";
import { generateSnowflake } from "../../lib/snowflake";
import { useValidation } from "../../middlewares/useValidation";
import { EvaluationLanguageSchema } from "../../utils/evaluation.schema";
import { extractIdFromParameters } from "../../utils/extractorUtils";
import { R } from "../../utils/remeda";
import { respond } from "../../utils/response";

const SubmissionHandler = Router();

const SubmissionSchema = Type.Object({
    language: EvaluationLanguageSchema,
    code: Type.String({ maxLength: 1 << 23 }),
});

SubmissionHandler.post("/:problem_id", useValidation(SubmissionSchema), async (req, res) => {
    const problem = await extractProblem(req);
    const user = await extractUser(req);
    const org = await extractCurrentOrganisation(req);

    if (problem.evaluation_variant !== "output-only" && req.body.code.length >= 64_000)
        throw new SafeError(StatusCodes.BAD_REQUEST);

    const endListener = async (submission: Submission) => {
        await Influx.insert(
            "submissions",
            {
                userId: user.id.toString(),
                orgId: org.id.toString(),
                successful: String(submission.verdict === "accepted"),
            },
            { id: createInfluxUInt(submission.id) }
        );
    };

    const problemWithFullData = await Database.selectOneFrom(
        "problems",
        ["evaluation_script", "evaluation_variant", "evaluation_language"],
        { id: problem.id }
    );

    if (!problemWithFullData) throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);

    const submissionId = await beginEvaluation(
        user,
        {
            problemId: problem.id,
            language: req.body.language,
            code: req.body.code,
            evaluation_variant: problemWithFullData.evaluation_variant,
            evaluator_language: problemWithFullData.evaluation_language,
            evaluator: problemWithFullData.evaluation_script,
        },
        endListener
    );

    return respond(res, StatusCodes.CREATED, { submission: submissionId });
});

// TODO: permissions return full response
const GetSchema = Type.Object({
    user_id: Type.String(),
});

SubmissionHandler.get("/", useValidation(GetSchema, { query: true }), async (req, res) => {
    const submissions = await Database.selectFrom("submissions", ["id"], {
        user_id: req.query.user_id,
    });

    return respond(res, StatusCodes.OK, submissions);
});

SubmissionHandler.get("/by-problem-all/:problem_id", async (req, res) => {
    const problem = await extractProblem(req);
    const contest = await extractContest(req, problem.contest_id);
    const submissions = await Database.selectFrom("submissions", "*", { problem_id: problem.id });

    const users = await Database.selectFrom("known_users", "*", {
        user_id: eqIn(...submissions.map((s) => s.user_id)),
    });

    const submissionsWithInfo = submissions.map((it) => ({
        ...it,
        ...R.pick(users.find((user) => user.user_id === it.user_id)!, ["email", "full_name"]),
    }));

    if (Date.now() > contest.start_time.getTime() + contest.duration_seconds * 1000)
        return respond(res, StatusCodes.OK, submissionsWithInfo);

    const user = await extractUser(req);

    if (hasAdminPermission(user.permissions, AdminPermissions.VIEW_CONTEST))
        return respond(res, StatusCodes.OK, submissionsWithInfo);

    const member = await extractContestMember(req, problem.contest_id);

    if (
        !hasContestPermission(
            member.contest_permissions,
            ContestMemberPermissions.VIEW_PRIVATE,
            user.permissions
        )
    )
        throw new SafeError(StatusCodes.FORBIDDEN);

    respond(res, StatusCodes.OK, submissionsWithInfo);
});

SubmissionHandler.post("/final/:submission_id", async (req, res) => {
    const user = await extractUser(req);
    const submission = await extractSubmission(req);
    const problem = await extractProblem(req, submission.problem_id);
    const contest = await extractContest(req, problem.contest_id);

    if (!contest.exam) throw new SafeError(StatusCodes.BAD_REQUEST);

    // TODO: see if there is a better way to structure this data to make the updates simpler but also allow for the needed queries
    const finalSubmissionsRecords = await Database.selectFrom("exam_final_submissions", "*", {
        contest_id: contest.id,
        user_id: user.id,
    });

    const finalSubmissions = await Database.selectFrom("submissions", "*", {
        id: eqIn(...finalSubmissionsRecords.map((r) => r.submission_id)),
    });

    const existingSubmission = finalSubmissions.find((s) => s.problem_id === submission.problem_id);

    if (existingSubmission) {
        const existingFinalSubmissionRecord = finalSubmissionsRecords.find(
            (record) => record.submission_id === existingSubmission.id
        );

        await Database.deleteFrom("exam_final_submissions", "*", {
            id: existingFinalSubmissionRecord!.id,
        });
    }

    const finalSubmission: ExamFinalSubmission = {
        id: generateSnowflake(),
        user_id: submission.user_id,
        contest_id: problem.contest_id,
        submission_id: submission.id,
        final_score: submission.awarded_score,
        reviewed: false,
    };

    const member = await Database.selectOneFrom("contest_members", "*", {
        user_id: submission.user_id,
        contest_id: problem.contest_id,
    });

    await Database.insertInto("exam_final_submissions", finalSubmission);

    if (!member) throw new SafeError(StatusCodes.BAD_REQUEST);

    await Database.raw(
        `UPDATE contest_members SET exam_score['${submission.problem_id}']=${submission.awarded_score} WHERE id=${member.id} AND contest_id=${member.contest_id} AND user_id=${member.user_id}`
    );

    return respond(res, StatusCodes.OK, finalSubmission);
});

const FinalSubmissionSchema = Type.Object({
    final_score: Type.Number(),
    reviewed: Type.Boolean(),
});

SubmissionHandler.patch(
    "/final/:final_submission_id",
    useValidation(FinalSubmissionSchema),
    async (req, res) => {
        const finalSubmissionId = extractIdFromParameters(req, "final_submission_id");

        const finalSubmission = await Database.selectOneFrom("exam_final_submissions", "*", {
            id: finalSubmissionId,
        });

        if (!finalSubmission) throw new SafeError(StatusCodes.NOT_FOUND);

        const member = await Database.selectOneFrom("contest_members", "*", {
            user_id: finalSubmission.user_id,
            contest_id: finalSubmission.contest_id,
        });

        if (!member) throw new SafeError(StatusCodes.NOT_FOUND);

        const submission = await extractSubmission(req, finalSubmission.submission_id);

        await extractModifiableContest(req, finalSubmission.contest_id);

        await Database.update(
            "exam_final_submissions",
            {
                final_score: req.body.final_score,
                reviewed: req.body.reviewed,
            },
            {
                id: finalSubmission.id,
                contest_id: finalSubmission.contest_id,
                user_id: finalSubmission.user_id,
            }
        );

        await Database.raw(
            `UPDATE contest_members SET exam_score['${submission.problem_id}']=${req.body.final_score} WHERE id=${member.id} AND contest_id=${member.contest_id} AND user_id=${member.user_id}`
        );

        return respond(res, StatusCodes.OK);
    }
);

SubmissionHandler.get("/final/:final_submission_id", async (req, res) => {
    const finalSubmission = await extractFinalSubmission(req);

    return respond(res, StatusCodes.OK, finalSubmission);
});

const GetFinalSubmissionSchema = Type.Object({
    user_id: Type.String(),
    contest_id: Type.String(),
});

SubmissionHandler.get(
    "/final/",
    useValidation(GetFinalSubmissionSchema, { query: true }),
    async (req, res) => {
        const user = await extractUser(req);
        const contest = await extractContest(req, BigInt(req.query.contest_id));

        if (!contest.exam) throw new SafeError(StatusCodes.BAD_REQUEST);

        const targetId = BigInt(req.query.user_id);

        if (user.id !== targetId) {
            const member = await extractContestMember(req, contest.id);

            if (
                !hasContestPermission(
                    member.contest_permissions,
                    ContestMemberPermissions.VIEW_PRIVATE,
                    user.permissions
                ) &&
                !hasAdminPermission(user.permissions, AdminPermissions.VIEW_CONTEST)
            )
                throw new SafeError(StatusCodes.FORBIDDEN);
        }

        const finalSubmissions = await Database.selectFrom("exam_final_submissions", "*", {
            user_id: targetId,
            contest_id: contest.id,
        });

        const submissions = await Database.selectFrom("submissions", ["id", "problem_id"], {
            id: eqIn(...finalSubmissions.map((finalSubmission) => finalSubmission.submission_id)),
        });

        return respond(
            res,
            StatusCodes.OK,
            R.map(finalSubmissions, (finalSubmission) =>
                R.addProp(
                    finalSubmission,
                    "problem_id",
                    submissions.find(
                        (submission) => submission.id === finalSubmission.submission_id
                    )?.problem_id ?? 0
                )
            )
        );
    }
);

SubmissionHandler.get("/by-problem/:problem_id", async (req, res) => {
    const problem = await extractProblem(req);
    const user = await extractOptionalUser(req);
    const contest = await extractContest(req, problem.contest_id);

    if (!req.query.user_id && !user) throw new SafeError(StatusCodes.BAD_REQUEST);

    const userId = req.query.user_id ? BigInt(req.query.user_id as string) : user!.id;

    const submissions = await Database.selectFrom(
        "submissions",
        "*",
        {
            problem_id: problem.id,
            user_id: userId,
        },
        "ALLOW FILTERING"
    );

    const pendingSubmissions = await getAllPendingSubmissions({
        userId: userId,
        problemId: problem.id,
    });

    if (!req.query.user_id) {
        // only return pending submissions if the submitter is the user
        const combined = [
            ...R.map(submissions, R.addProp("completed", true)),
            ...R.pipe(
                pendingSubmissions,
                R.map(R.addProp("completed", false)),
                R.filter((it) => submissions.every((submission) => submission.id !== it.id))
            ),
        ];

        return respond(res, StatusCodes.OK, combined);
    }

    if (contest.start_time.getTime() + contest.duration_seconds * 1000 <= Date.now())
        return respond(res, StatusCodes.OK, submissions);

    if (!user) throw new SafeError(StatusCodes.NOT_FOUND);

    await extractModifiableContest(req, problem.contest_id);

    return respond(res, StatusCodes.OK, submissions);
});

SubmissionHandler.get("/:submission_id", async (req, res) => {
    const submission = await extractSubmission(req);

    return respond(res, StatusCodes.OK, submission);
});

SubmissionHandler.get("/cluster/:submission_id", async (req, res) => {
    const submission = await extractSubmission(req);

    const clusters = await Database.selectFrom("cluster_submissions", "*", {
        submission_id: submission.id,
    });

    return respond(res, StatusCodes.OK, clusters);
});

SubmissionHandler.get("/testcase/:cluster_submission_id", async (req, res) => {
    const clusterSubmission = await extractClusterSubmission(req);

    const testcases = await Database.selectFrom("testcase_submissions", "*", {
        cluster_submission_id: clusterSubmission.id,
    });

    return respond(res, StatusCodes.OK, testcases);
});

export default SubmissionHandler;
