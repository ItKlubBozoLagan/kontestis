import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../database/Database";
import { generateSnowflake } from "../lib/snowflake";
import {
    AuthenticatedRequest,
    useAuth,
    useOptionalAuth,
} from "../middlewares/useAuth";
import { useValidation, ValidatedBody } from "../middlewares/useValidation";
import { Cluster } from "../types/Cluster";
import { Problem } from "../types/Problem";
import { Testcase } from "../types/Testcase";
import { respond } from "../utils/response";
import {
    isAllowedToModifyContest,
    isAllowedToViewContest,
    isAllowedToViewProblem,
} from "../utils/utils";

const ProblemHandler = Router();

/**
 * @apiDefine ExampleProblem
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "id": "135343706118033408",
 *         "contest_id": "135335143509331968",
 *         "description": "Example!",
 *         "title": "Example Problem",
 *         "evaluation_variant": "plain",
 *         "time_limit_millies": 1000,
 *         "memory_limit_megabytes": 512
 *     }
 */

/**
 * @apiDefine ExampleCluster
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "id": "135343706118033408",
 *         "problem_id": "135335143509331968",
 *         "awarded_score": 20
 *     }
 */

/**
 * @apiDefine ExampleTestcase
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "id": "135343706118033408",
 *         "cluster_id": "135335143509331968",
 *         "input": "10 2",
 *         "correctOutput": "20"
 *     }
 */

enum EvaluationSchema {
    plain = "plain",
    script = "script",
    interactive = "interactive",
}

const problemSchema = Type.Object({
    contest_id: Type.RegEx(/\d{16,20}/g),
    title: Type.String(),
    description: Type.String(),
    evaluation_variant: Type.Enum(EvaluationSchema),
    time_limit_millis: Type.Number({ minimum: 50, maximum: 10_000 }),
    memory_limit_megabytes: Type.Number({ minimum: 32, maximum: 1024 }),
});

/**
 * @api {post} /api/problem CreateProblem
 * @apiName CreateProblem
 * @apiGroup Problem
 *
 * @apiUse RequiredAuth
 *
 * @apiBody {String} title Title of the problem.
 * @apiBody {String} description Description of the problem.
 * @apiBody {String="plain","script","interactive"} evaluation_variant Evaluation variant.
 * @apiBody {String} [evaluation_script] If the variant is not plain a script needs to be provided.
 * @apiBody {Number} time_limit_millis Time limit in milliseconds.
 * @apiBody {Number} memory_limit_megabytes The memory limit in megabytes.
 *
 * @apiSuccess {Object} problem Created problem.
 *
 * @apiUse ExampleProblem
 *
 * @apiError MissingScript If the evaluation script is needed but its missing.
 *
 * @apiErrorExample Error-Response:
 *     400 Bad request
 */

ProblemHandler.post(
    "/",
    useAuth,
    useValidation(problemSchema),
    async (
        req: AuthenticatedRequest & ValidatedBody<typeof problemSchema>,
        res
    ) => {
        const user = req.user!;

        const contest_id = BigInt(req.body.contest_id);

        if (!(await isAllowedToModifyContest(user.id, contest_id)))
            return respond(res, StatusCodes.FORBIDDEN);

        if (
            req.body.evaluation_variant != "plain" &&
            !req.body.evaluation_script
        )
            return respond(res, StatusCodes.NOT_FOUND);

        const problem: Problem = {
            id: generateSnowflake(),
            contest_id: contest_id,
            title: req.body.title,
            description: req.body.description,
            evaluation_variant: req.body.evaluation_variant,
            evaluation_script: req.body.evaluation_script,
            time_limit_millis: req.body.time_limit_millis,
            memory_limit_megabytes: req.body.memory_limit_megabytes,
        };

        await Database.insertInto("problems", problem);

        return respond(res, StatusCodes.OK, problem);
    }
);

/**
 * @api {delete} /api/problem/:problem_id DeleteProblem
 * @apiName DeleteProblem
 * @apiGroup Problem
 *
 * @apiUse RequiredAuth
 *
 * @apiParam {String} problem_id Id of the problem that will be deleted
 *
 * @apiSuccess {Object} problem Deleted problem.
 *
 * @apiUse ExampleProblem
 */

ProblemHandler.delete(
    "/:problem_id",
    useAuth,
    async (req: AuthenticatedRequest, res) => {
        const user = req.user!;

        const problem = await Database.selectOneFrom("problems", "*", {
            id: req.params.problem_id,
        });

        if (!problem) return respond(res, StatusCodes.NOT_FOUND);

        if (!(await isAllowedToModifyContest(user.id, problem.contest_id)))
            return respond(res, StatusCodes.FORBIDDEN);

        await Database.deleteFrom("problems", "*", { id: problem.id });

        const clusters = await Database.selectFrom("clusters", "*", {
            problem_id: problem.id,
        });

        await Database.deleteFrom("clusters", "*", { problem_id: problem.id });

        await Promise.all(
            clusters.map((cluster) =>
                Database.deleteFrom("testcases", "*", {
                    cluster_id: cluster.id,
                })
            )
        );

        const submissions = await Database.selectFrom("submissions", "*", {
            problem_id: problem.id,
        });

        await Database.deleteFrom("submissions", "*", {
            problem_id: problem.id,
        });

        await Promise.all(
            submissions.map((submission) =>
                Promise.all([
                    Database.deleteFrom("cluster_submissions", "*", {
                        submission_id: submission.id,
                    }),
                    Database.deleteFrom("testcase_submissions", "*", {
                        submission_id: submission.id,
                    }),
                ])
            )
        );

        return respond(res, StatusCodes.OK);
    }
);

const clusterSchema = Type.Object({
    awarded_score: Type.Number({ minimum: 1, maximum: 1000 }),
});

/**
 * @api {post} /api/problem/cluster/:problem_id CreateCluster
 * @apiName CreateCluster
 * @apiGroup Problem
 *
 * @apiUse RequiredAuth
 *
 * @apiParam {String} problem_id Id of the problem.
 *
 * @apiBody {Number} awarded_score The awared scrore for massing the cluster.
 *
 * @apiSuccess {Object} cluster Create cluster.
 *
 * @apiUse ExampleCluster
 *
 */

ProblemHandler.post(
    "/cluster/:problem_id",
    useAuth,
    useValidation(clusterSchema),
    async (
        req: AuthenticatedRequest & ValidatedBody<typeof clusterSchema>,
        res
    ) => {
        const user = req.user!;

        const problem = await Database.selectOneFrom("problems", "*", {
            id: req.params.problem_id,
        });

        if (!problem) return respond(res, StatusCodes.NOT_FOUND);

        if (!(await isAllowedToModifyContest(user.id, problem.contest_id)))
            return respond(res, StatusCodes.FORBIDDEN);

        const cluster: Cluster = {
            id: generateSnowflake(),
            problem_id: problem.id,
            awarded_score: req.body.awarded_score,
        };

        await Database.insertInto("clusters", cluster);

        return respond(res, StatusCodes.OK, cluster);
    }
);

/**
 * @api {delete} /api/problem/cluster/:cluster_id DeleteCluster
 * @apiName DeleteCluster
 * @apiGroup Problem
 *
 * @apiUse RequiredAuth
 *
 * @apiParam {String} cluster_id Id of the cluster that will be deleted
 *
 * @apiSuccess {Object} cluster Deleted cluster.
 *
 * @apiUse ExampleCluster
 *
 */

ProblemHandler.delete(
    "/cluster/:cluster_id",
    useAuth,
    async (req: AuthenticatedRequest, res) => {
        const user = req.user!;

        const cluster = await Database.selectOneFrom("clusters", "*", {
            id: req.params.cluster_id,
        });

        if (!cluster) return respond(res, StatusCodes.NOT_FOUND);

        const problem = await Database.selectOneFrom("problems", "*", {
            id: cluster.problem_id,
        });

        if (!problem) return respond(res, StatusCodes.INTERNAL_SERVER_ERROR);

        if (!(await isAllowedToModifyContest(user.id, problem.contest_id)))
            return respond(res, StatusCodes.FORBIDDEN);

        await Database.deleteFrom("clusters", "*", { id: cluster.id });
        const testcases = await Database.selectFrom("testcases", "*", {
            cluster_id: cluster.id,
        });

        await Database.deleteFrom("testcases", "*", { cluster_id: cluster.id });
        await Database.deleteFrom("cluster_submissions", "*", {
            cluster_id: cluster.id,
        });

        await Promise.all(
            testcases.map((testcase) =>
                Database.deleteFrom("testcase_submissions", "*", {
                    testcase_id: testcase.id,
                })
            )
        );

        return respond(res, StatusCodes.OK);
    }
);

const testcaseSchema = Type.Object({
    input: Type.String(),
    correctOutput: Type.String({ default: "" }),
});

/**
 * @api {post} /api/problem/testcase/:cluster_id CreateTestcase
 * @apiName CreateTestcase
 * @apiGroup Problem
 *
 * @apiUse RequiredAuth
 *
 * @apiParam {String} cluster_id Id of the cluster.
 *
 * @apiBody {String} input Testcase input.
 * @apiBody {String} correctOutput Testcase correct output, empty string if not needed.
 *
 * @apiSuccess {Object} testcase Created testcase.
 *
 * @apiUse ExampleTestcase
 *
 */

ProblemHandler.post(
    "/testcase/:cluster_id",
    useAuth,
    useValidation(testcaseSchema),
    async (
        req: AuthenticatedRequest & ValidatedBody<typeof testcaseSchema>,
        res
    ) => {
        const user = req.user!;

        const cluster = await Database.selectOneFrom("clusters", "*", {
            id: req.params.cluster_id,
        });

        if (!cluster) return respond(res, StatusCodes.NOT_FOUND);

        const problem = await Database.selectOneFrom("problems", "*", {
            id: cluster.problem_id,
        });

        if (!problem) return respond(res, StatusCodes.INTERNAL_SERVER_ERROR);

        if (!(await isAllowedToModifyContest(user.id, problem.contest_id)))
            return respond(res, StatusCodes.FORBIDDEN);

        const testcase: Testcase = {
            id: generateSnowflake(),
            cluster_id: cluster.id,
            input: req.body.input,
            correctOutput: req.body.correctOutput,
        };

        await Database.insertInto("testcases", testcase);

        return respond(res, StatusCodes.OK, testcase);
    }
);

/**
 * @api {delete} /api/problem/testcase/:testcase_id DeleteTestcase
 * @apiName DeleteTestcase
 * @apiGroup Problem
 *
 * @apiUse RequiredAuth
 *
 * @apiParam {String} testcase_id Id of the testcase.
 *
 *
 * @apiSuccess {Object} testcase Deleted testcase.
 *
 * @apiUse ExampleTestcase
 *
 */

ProblemHandler.delete(
    "/testcase/:testcase_id",
    useAuth,
    async (req: AuthenticatedRequest, res) => {
        const user = req.user!;

        const testcase = await Database.selectOneFrom("testcases", "*", {
            id: req.params.testcase_id,
        });

        if (!testcase) return respond(res, StatusCodes.NOT_FOUND);

        const cluster = await Database.selectOneFrom("clusters", "*", {
            id: testcase.cluster_id,
        });

        if (!cluster) return respond(res, StatusCodes.INTERNAL_SERVER_ERROR);

        const problem = await Database.selectOneFrom("problems", "*", {
            id: cluster.problem_id,
        });

        if (!problem) return respond(res, StatusCodes.INTERNAL_SERVER_ERROR);

        if (!(await isAllowedToModifyContest(user.id, problem.contest_id)))
            return respond(res, StatusCodes.FORBIDDEN);

        await Database.deleteFrom("testcases", "*", { id: testcase.id });
        await Database.deleteFrom("testcase_submissions", "*", {
            testcase_id: testcase.id,
        });

        return respond(res, StatusCodes.OK);
    }
);

const getSchema = Type.Object({
    contest_id: Type.String(),
});

/**
 * @api {get} /api/problem GetProblems
 * @apiName GetProblems
 * @apiGroup Problem
 *
 * @apiUse RequiredAuth
 *
 * @apiQuery {String} contest_id If of the contest to view problems.
 *
 * @apiSuccess {Object} problems Contest problems.
 *
 * @apiUse ExampleProblem
 */

ProblemHandler.get(
    "/",
    useOptionalAuth,
    useValidation(getSchema, { query: true }),
    async (
        req: AuthenticatedRequest & ValidatedBody<typeof getSchema>,
        res
    ) => {
        const problems = await Database.selectFrom("problems", "*", {
            contest_id: req.query.contest_id,
        });

        if (
            !(await isAllowedToViewContest(
                req.user ? req.user.id : undefined,
                req.query.contest_id
            ))
        )
            return respond(res, StatusCodes.NOT_FOUND);

        if (
            !(await isAllowedToViewContest(
                req.user ? req.user.id : undefined,
                req.query.contest_id
            ))
        )
            return respond(res, StatusCodes.NOT_FOUND);

        // cancer
        const allowedProblems = (
            await Promise.all(
                problems.map((problem) => {
                    return [
                        problem,
                        isAllowedToViewProblem(
                            req.user ? req.user.id : undefined,
                            problem.id
                        ),
                    ] as [Problem, Promise<boolean>];
                })
            )
        )
            .filter(([_, allowed]) => allowed)
            .map(([problem]) => problem);

        return respond(res, StatusCodes.OK, allowedProblems);
    }
);

/**
 * @api {get} /api/problem/:problem_id GetProblem
 * @apiName GetProblem
 * @apiGroup Problem
 *
 * @apiParam {String} problem_id Id of the problem.
 *
 * @apiUse RequiredAuth
 *
 * @apiSuccess {Object} problem Selected problem.
 *
 * @apiUse ExampleProblem
 *
 */

ProblemHandler.get(
    "/:problem_id",
    useOptionalAuth,
    async (req: AuthenticatedRequest, res) => {
        const problem = await Database.selectOneFrom("problems", "*", {
            id: req.params.problem_id,
        });

        if (!problem) return respond(res, StatusCodes.NOT_FOUND);

        if (
            !(await isAllowedToViewProblem(
                req.user ? req.user.id : undefined,
                problem.id
            ))
        )
            return respond(res, StatusCodes.NOT_FOUND);

        if (
            !req.user ||
            !(await isAllowedToModifyContest(req.user.id, problem.contest_id))
        )
            delete problem.evaluation_script;

        return respond(res, StatusCodes.OK, problem);
    }
);

/**
 * @api {get} /api/cluster/:problem_id GetClusters
 * @apiName GetClusters
 * @apiGroup Problem
 *
 * @apiParam {String} problem_id Id of the problem.
 *
 * @apiUse RequiredAuth
 *
 * @apiSuccess {Object} clusters Problem clusters.
 *
 * @apiUse ExampleCluster
 *
 */

ProblemHandler.get(
    "/cluster/:problem_id",
    useOptionalAuth,
    async (req: AuthenticatedRequest, res) => {
        const problem = await Database.selectOneFrom("problems", "*", {
            id: req.params.problem_id,
        });

        if (!problem) return respond(res, StatusCodes.NOT_FOUND);

        if (
            !(await isAllowedToViewProblem(
                req.user ? req.user.id : undefined,
                problem.id
            ))
        )
            return respond(res, StatusCodes.NOT_FOUND);

        const clusters = await Database.selectFrom("clusters", "*", {
            problem_id: problem.id,
        });

        return respond(res, StatusCodes.OK, clusters);
    }
);

/**
 * @api {get} /api/testcase/:cluster_id GetTestcases
 * @apiName GetTestcases
 * @apiGroup Problem
 *
 * @apiParam {String} cluster_id Id of the cluster.
 *
 * @apiUse RequiredAuth
 *
 * @apiSuccess {Object} testcases Cluster testcases.
 *
 * @apiUse ExampleTestcase
 *
 */

ProblemHandler.get(
    "/testcase/:cluster_id",
    useOptionalAuth,
    async (req: AuthenticatedRequest, res) => {
        const cluster = await Database.selectOneFrom("clusters", "*", {
            id: req.params.cluster_id,
        });

        if (!cluster) return respond(res, StatusCodes.NOT_FOUND);

        const problem = await Database.selectOneFrom("problems", "*", {
            id: cluster.problem_id,
        });

        if (!problem) return respond(res, StatusCodes.INTERNAL_SERVER_ERROR);

        if (
            !(await isAllowedToViewProblem(
                req.user ? req.user.id : undefined,
                problem.id
            ))
        )
            return respond(res, StatusCodes.NOT_FOUND);

        const contest = await Database.selectOneFrom("contests", "*", {
            id: problem.contest_id,
        });

        if (!contest) return respond(res, StatusCodes.INTERNAL_SERVER_ERROR);

        const testcases = await Database.selectFrom("testcases", "*", {
            cluster_id: cluster.id,
        });

        if (
            contest.start_time.getTime() + contest.duration_seconds * 1000 <
            Date.now()
        )
            return respond(res, StatusCodes.OK, testcases);

        if (
            await isAllowedToModifyContest(
                req.user ? req.user.id : undefined,
                contest.id
            )
        )
            return respond(res, StatusCodes.OK, testcases);

        return respond(res, StatusCodes.NOT_FOUND);
    }
);

export default ProblemHandler;
