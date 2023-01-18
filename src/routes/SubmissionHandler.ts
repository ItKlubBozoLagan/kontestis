import { Type } from "@sinclair/typebox";
import { Router } from "express";

import { Database } from "../database/Database";
import { generateSnowflake } from "../lib/snowflake";
import {
    AuthenticatedRequest,
    useAuth,
    useOptionalAuth,
} from "../middlewares/useAuth";
import { useValidation, ValidatedBody } from "../middlewares/useValidation";
import { Submission } from "../types/Submission";
import {
    isAllowedToModifyContest,
    isAllowedToViewContest,
    isAllowedToViewProblem,
    isAllowedToViewSubmission,
} from "../utils/utills";

const SubmissionHandler = Router();

enum EvaluationLanguage {
    c = "c",
    cpp = "cpp",
    py = "python",
}

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
    language: Type.Enum(EvaluationLanguage),
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
        if (!req.user) return res.status(403);

        if (!(await isAllowedToViewProblem(req.user.id, req.params.problem_id)))
            return res.status(404);

        const submission: Submission = {
            id: generateSnowflake(),
            user_id: req.user.id,
            problem_id: req.params.problem_id,
            language: req.body.language,
            code: req.body.code,
            completed: false,
        };

        await Database.insertInto("submissions", submission);

        // TODO: Start evaluation process.

        return res.status(200).json(submission);
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
    async (request: AuthenticatedRequest, res) => {
        const problem = await Database.selectOneFrom(
            "problems",
            ["contest_id"],
            { id: request.params.problem_id }
        );

        if (!problem) return res.status(404);

        const contest = await Database.selectOneFrom("contests", "*", {
            id: problem.contest_id,
        });

        if (!contest) return res.status(500);

        if (
            !(await isAllowedToViewContest(
                request.user ? request.user.id : undefined,
                contest.id
            ))
        )
            return res.status(404);

        const submissions = await Database.selectFrom(
            "submissions",
            "*",
            request.query.user_id
                ? {
                      problem_id: request.params.problem_id,
                      user_id: request.params.user_id,
                  }
                : { problem_id: request.params.problem_id }
        );

        if (
            request.query.user_id ||
            contest.start_time.getTime() + contest.duration_seconds * 1000 <
                Date.now()
        )
            return res.status(200).json(submissions);

        if (!request.user) return res.status(404);

        const { user } = request;

        if (await isAllowedToModifyContest(user.id, contest.id))
            return res.status(200).json(submissions);

        return res
            .status(200)
            .json(submissions.filter((s) => s.user_id === user.id));
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
    async (request: AuthenticatedRequest, res) => {
        const submission = await Database.selectOneFrom("submissions", "*", {
            id: request.params.submission_id,
        });

        if (!submission) return res.status(404);

        if (
            !(await isAllowedToViewSubmission(
                request.user ? request.user.id : undefined,
                submission.id
            ))
        )
            return res.status(404);

        return res.status(200).json(submission);
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
    async (request: AuthenticatedRequest, res) => {
        const submission = await Database.selectOneFrom("submissions", "*", {
            id: request.params.submission_id,
        });

        if (!submission) return res.status(404);

        if (
            !(await isAllowedToViewSubmission(
                request.user ? request.user.id : undefined,
                submission.id
            ))
        )
            return res.status(404);

        const clusters = await Database.selectFrom("cluster_submissions", "*", {
            submission_id: submission.id,
        });

        return res.status(200).json(clusters);
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
    async (request: AuthenticatedRequest, res) => {
        const submission = await Database.selectOneFrom("submissions", "*", {
            id: request.params.submission_id,
        });

        if (!submission) return res.status(404);

        if (
            !(await isAllowedToViewSubmission(
                request.user ? request.user.id : undefined,
                submission.id
            ))
        )
            return res.status(404);

        const testcases = await Database.selectFrom(
            "testcase_submissions",
            "*",
            { submission_id: submission.id }
        );

        return res.status(200).json(testcases);
    }
);

export default SubmissionHandler;
