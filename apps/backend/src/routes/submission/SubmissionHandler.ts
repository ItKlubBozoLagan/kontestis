import {
    AdminPermissions,
    ContestMemberPermissions,
    ExamFinalSubmission,
    hasAdminPermission,
    hasContestPermission,
} from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import * as R from "remeda";
import { eqIn } from "scyllo";

import { Database } from "../../database/Database";
import { SafeError } from "../../errors/SafeError";
import { extractClusterSubmission } from "../../extractors/extractClusterSubmission";
import { extractContest } from "../../extractors/extractContest";
import { extractContestMember } from "../../extractors/extractContestMember";
import { extractModifiableContest } from "../../extractors/extractModifiableContest";
import { extractOptionalUser } from "../../extractors/extractOptionalUser";
import { extractProblem } from "../../extractors/extractProblem";
import { extractSubmission } from "../../extractors/extractSubmission";
import { extractUser } from "../../extractors/extractUser";
import { beginEvaluation } from "../../lib/evaluation";
import { getAllPendingSubmissions } from "../../lib/pendingSubmission";
import { generateSnowflake } from "../../lib/snowflake";
import { useValidation } from "../../middlewares/useValidation";
import { respond } from "../../utils/response";

const SubmissionHandler = Router();

const submissionSchema = Type.Object({
    language: Type.Union([Type.Literal("c"), Type.Literal("cpp"), Type.Literal("python")]),
    code: Type.String({ maxLength: 64_000 }),
});

SubmissionHandler.post("/:problem_id", useValidation(submissionSchema), async (req, res) => {
    const problem = await extractProblem(req);
    const user = await extractUser(req);

    const submissionId = await beginEvaluation(user, {
        problemId: problem.id,
        language: req.body.language,
        code: req.body.code,
    });

    return respond(res, StatusCodes.CREATED, { submission: submissionId });
});

// TODO: Permissions return full response

const getSchema = Type.Object({
    user_id: Type.String(),
});

SubmissionHandler.get("/", useValidation(getSchema, { query: true }), async (req, res) => {
    const submissions = await Database.selectFrom("submissions", ["id"], {
        user_id: req.query.user_id,
    });

    return respond(res, StatusCodes.OK, submissions);
});

SubmissionHandler.get("/by-problem-all/:problem_id", async (req, res) => {
    const problem = await extractProblem(req);
    const contest = await extractContest(req, problem.contest_id);
    const member = await extractContestMember(req, problem.contest_id);

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

    if (!hasContestPermission(member.contest_permissions, ContestMemberPermissions.VIEW_PRIVATE))
        throw new SafeError(StatusCodes.FORBIDDEN);

    respond(res, StatusCodes.OK, submissionsWithInfo);
});

SubmissionHandler.post("/final/:submission_id", async (req, res) => {
    const submission = await extractSubmission(req);
    const problem = await extractProblem(req, submission.problem_id);
    const contest = await extractContest(req, problem.contest_id);

    if (!contest.exam) throw new SafeError(StatusCodes.BAD_REQUEST);

    await Database.deleteFrom("exam_final_submissions", "*", { submission_id: submission.id });

    const finalSubmission: ExamFinalSubmission = {
        id: generateSnowflake(),
        user_id: submission.user_id,
        contest_id: problem.contest_id,
        submission_id: submission.id,
    };

    await Database.insertInto("exam_final_submissions", finalSubmission);

    return respond(res, StatusCodes.OK, finalSubmission);
});

const getFinalSubmissionSchema = Type.Object({
    user_id: Type.String(),
    contest_id: Type.String(),
});

SubmissionHandler.get(
    "/final/",
    useValidation(getFinalSubmissionSchema, { query: true }),
    async (req, res) => {
        const user = await extractUser(req);
        const contest = await extractContest(req, req.body.contest_id);

        if (!contest.exam) throw new SafeError(StatusCodes.BAD_REQUEST);

        const targetId = BigInt(req.query.user_id);

        if (user.id !== targetId) {
            const member = await extractContestMember(req, contest.id);

            if (
                !hasContestPermission(
                    member.contest_permissions,
                    ContestMemberPermissions.VIEW_PRIVATE
                ) &&
                !hasAdminPermission(user.permissions, AdminPermissions.VIEW_CONTEST)
            )
                throw new SafeError(StatusCodes.FORBIDDEN);
        }

        const finalSubmissions = await Database.selectFrom("exam_final_submissions", "*", {
            user_id: targetId,
            contest_id: contest.id,
        });

        return respond(res, StatusCodes.OK, finalSubmissions);
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
