import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import { beginEvaluation } from "../core/evaluation";
import { Database } from "../database/Database";
import {
    AuthenticatedRequest,
    useAuth,
    useOptionalAuth,
} from "../middlewares/useAuth";
import { useValidation, ValidatedBody } from "../middlewares/useValidation";
import { respond } from "../utils/response";
import {
    isAllowedToModifyContest,
    isAllowedToViewContest,
    isAllowedToViewProblem,
    isAllowedToViewSubmission,
} from "../utils/utils";

const SubmissionHandler = Router();

/**
 * @apiDefine ExampleSubmissionPending
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "id": "135343706118033408",
 *         "user_id": 135335143509331968,
 *         "problem_id": "135335143509331968",
 *         "language": "cpp",
 *         "code": "RXhhbXBsZSB0ZXh0IQ==",
 *         "completed": false
 *     }
 */

/**
 * @apiDefine ExampleSubmission
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "id": "135343706118033408",
 *         "user_id": 135335143509331968,
 *         "problem_id": "135335143509331968",
 *         "language": "cpp",
 *         "code": "RXhhbXBsZSB0ZXh0IQ==",
 *         "completed": true,
 *         "verdict": "accepted",
 *         "awardedScore": 110,
 *         "time_used_millis": 523,
 *         "memory_used_megabytes": 2.54
 *     }
 */

/**
 * @apiDefine ExampleSubmissionCluster
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     [{
 *         "id": "135343706118033408",
 *         "submission_id": 135335143509331968,
 *         "cluster_id": "135335143509331968",
 *         "verdict": "accepted",
 *         "awardedScore": 50,
 *         "time_used_millis": 234,
 *         "memory_used_megabytes": 1.94
 *     }]
 */

/**
 * @apiDefine ExampleSubmissionTestcase
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     [{
 *         "id": "135343706118033408",
 *         "submission_id": 135335143509331968,
 *         "testcase_id": "135335143509331968",
 *         "verdict": "accepted",
 *         "awardedScore": 50,
 *         "time_used_millis": 123,
 *         "memory_used_megabytes": 1.54
 *     }]
 */

const submissionSchema = Type.Object({
    language: Type.Union([
        Type.Literal("c"),
        Type.Literal("cpp"),
        Type.Literal("python"),
    ]),
    code: Type.String({ maxLength: 64_000 }),
});

/**
 * @api {post} /api/submission/:problem_id CreateSubmission
 * @apiName CreateSubmission
 * @apiGroup Submission
 *
 * @apiUse RequiredAuth
 *
 * @apiParam {String} problem_id Id of the problem.
 *
 * @apiBody {String="c","cpp","python"} language Programing language.
 * @apiBody {String} code Base64 encoded code.
 *
 * @apiSuccess {Object} submission Created submission.
 *
 * @apiUse ExampleSubmissionPending
 *
 */

SubmissionHandler.post(
    "/:problem_id",
    useAuth,
    useValidation(submissionSchema),
    async (
        req: AuthenticatedRequest & ValidatedBody<typeof submissionSchema>,
        res
    ) => {
        const user = req.user!;

        const problemId = BigInt(req.params.problem_id);

        if (!(await isAllowedToViewProblem(user.id, problemId)))
            return respond(res, StatusCodes.NOT_FOUND);

        const submissionId = await beginEvaluation(user, {
            problemId,
            language: req.body.language,
            code: req.body.code,
        });

        return respond(res, StatusCodes.CREATED, { submission: submissionId });
    }
);

// TODO: Permissions return full res!

/**
 * @api {get} /api/problem GetSubmissions
 * @apiName GetSubmissions
 * @apiGroup Submission
 *
 * @apiUse RequiredAuth
 *
 * @apiQuery {String} user_id Id of the user to view submissions.
 *
 * @apiSuccess {Object} ids submissions with only id field.
 *
 */

const getSchema = Type.Object({
    user_id: Type.String(),
});

SubmissionHandler.get(
    "/",
    useValidation(getSchema, { query: true }),
    async (req, res) => {
        const submissions = await Database.selectFrom("submissions", ["id"], {
            user_id: req.query.user_id,
        });

        return res.status(200).json(submissions);
    }
);

/**
 * @api {get} /api/submission/:problem_id GetSubmissions
 * @apiName GetSubmissions
 * @apiGroup Submission
 *
 * @apiUse RequiredAuth
 *
 * @apiParam {String} problem_id Id of the problem.
 *
 * @apiUse ExampleSubmission
 *
 * @apiSuccess {Object} submissions List of all problem submissions the user has access to!
 */

SubmissionHandler.get(
    "/:problem_id",
    useOptionalAuth,
    async (req: AuthenticatedRequest, res) => {
        const problem = await Database.selectOneFrom(
            "problems",
            ["contest_id"],
            { id: req.params.problem_id }
        );

        if (!problem) return respond(res, StatusCodes.NOT_FOUND);

        const contest = await Database.selectOneFrom("contests", "*", {
            id: problem.contest_id,
        });

        if (!contest) return respond(res, StatusCodes.INTERNAL_SERVER_ERROR);

        if (
            !(await isAllowedToViewContest(
                req.user ? req.user.id : undefined,
                contest.id
            ))
        )
            return respond(res, StatusCodes.NOT_FOUND);

        const submissions = await Database.selectFrom(
            "submissions",
            "*",
            req.query.user_id
                ? {
                      problem_id: req.params.problem_id,
                      user_id: req.params.user_id,
                  }
                : { problem_id: req.params.problem_id }
        );

        if (
            req.query.user_id ||
            contest.start_time.getTime() + contest.duration_seconds * 1000 <
                Date.now()
        )
            return respond(res, StatusCodes.OK, submissions);

        if (!req.user) return respond(res, StatusCodes.NOT_FOUND);

        if (await isAllowedToModifyContest(req.user.id, contest.id))
            return res.status(200).json(submissions);

        return respond(
            res,
            StatusCodes.OK,
            submissions.filter((s) => s.user_id === req.user?.id)
        );
    }
);

/**
 * @api {get} /api/submission/submission/:submission_id GetSubmission
 * @apiName GetSubmission
 * @apiGroup Submission
 *
 * @apiUse RequiredAuth
 *
 * @apiParam {String} submission_id Id of the submission.
 *
 * @apiUse ExampleSubmission
 *
 * @apiSuccess {Object} submission Selected submission.
 */

SubmissionHandler.get(
    "/submission/:submission_id",
    useOptionalAuth,
    async (req: AuthenticatedRequest, res) => {
        const submission = await Database.selectOneFrom("submissions", "*", {
            id: req.params.submission_id,
        });

        if (!submission) return respond(res, StatusCodes.NOT_FOUND);

        if (
            !(await isAllowedToViewSubmission(
                req.user ? req.user.id : undefined,
                submission.id
            ))
        )
            return respond(res, StatusCodes.NOT_FOUND);

        const cs = await Database.selectFrom("cluster_submissions", "*", {
            submission_id: submission.id,
        });
        const ts = await Database.selectFrom("testcase_submissions", "*", {
            submission_id: submission.id,
        });

        console.log(cs, ts);

        return respond(res, StatusCodes.OK, submission);
    }
);

/**
 * @api {get} /api/submission/cluster/:submission_id GetSubmissionClusters
 * @apiName GetSubmissionClusters
 * @apiGroup Submission
 *
 * @apiUse RequiredAuth
 *
 * @apiParam {String} submission_id Id of the submission.
 *
 * @apiSuccess {Object} clusters Submission cluster results.
 *
 * @apiUse ExampleSubmissionCluster
 */

SubmissionHandler.get(
    "/cluster/:submission_id",
    useOptionalAuth,
    async (req: AuthenticatedRequest, res) => {
        const submission = await Database.selectOneFrom("submissions", "*", {
            id: req.params.submission_id,
        });

        if (!submission) return respond(res, StatusCodes.NOT_FOUND);

        if (
            !(await isAllowedToViewSubmission(
                req.user ? req.user.id : undefined,
                submission.id
            ))
        )
            return respond(res, StatusCodes.NOT_FOUND);

        const clusters = await Database.selectFrom("cluster_submissions", "*", {
            submission_id: submission.id,
        });

        return respond(res, StatusCodes.OK, clusters);
    }
);

/**
 * @api {get} /api/testcase/cluster/:submission_id GetSubmissionTestcases
 * @apiName GetSubmissionTestcases
 * @apiGroup Submission
 *
 * @apiUse RequiredAuth
 *
 * @apiParam {String} submission_id Id of the submission.
 *
 * @apiSuccess {Object} testcases Submission testcases.
 *
 * @apiUse ExampleSubmissionTestcase
 */

SubmissionHandler.get(
    "/testcase/:submission_id",
    useOptionalAuth,
    async (req: AuthenticatedRequest, res) => {
        const submission = await Database.selectOneFrom("submissions", "*", {
            id: req.params.submission_id,
        });

        if (!submission) return respond(res, StatusCodes.NOT_FOUND);

        if (
            !(await isAllowedToViewSubmission(
                req.user ? req.user.id : undefined,
                submission.id
            ))
        )
            return respond(res, StatusCodes.NOT_FOUND);

        const testcases = await Database.selectFrom(
            "testcase_submissions",
            "*",
            { submission_id: submission.id }
        );

        return respond(res, StatusCodes.OK, testcases);
    }
);

export default SubmissionHandler;
