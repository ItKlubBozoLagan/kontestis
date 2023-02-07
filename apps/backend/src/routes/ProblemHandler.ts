import { Cluster } from "@kontestis/models";
import { Problem } from "@kontestis/models";
import { Testcase } from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { extractCluster } from "../extractors/extractCluster";
import { extractContest } from "../extractors/extractContest";
import { extractModifiableCluster } from "../extractors/extractModifiableCluster";
import { extractModifiableContest } from "../extractors/extractModifiableContest";
import { extractModifiableProblem } from "../extractors/extractModifiableProblem";
import { extractModifiableTestcase } from "../extractors/extractModifiableTestcase";
import { extractProblem } from "../extractors/extractProblem";
import { generateSnowflake } from "../lib/snowflake";
import { useValidation } from "../middlewares/useValidation";
import { respond } from "../utils/response";

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
    title: Type.String(),
    description: Type.String(),
    evaluation_variant: Type.Enum(EvaluationSchema),
    evaluation_script: Type.Optional(Type.String()),
    time_limit_millis: Type.Number({ minimum: 50, maximum: 10_000 }),
    memory_limit_megabytes: Type.Number({ minimum: 32, maximum: 1024 }),
});

/**
 * @api {post} /api/problem/:contest_id CreateProblem
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
    "/:contest_id",
    useValidation(problemSchema),
    async (req, res) => {
        const contest = await extractModifiableContest(req);

        if (
            req.body.evaluation_variant != "plain" &&
            !req.body.evaluation_script
        )
            throw new SafeError(StatusCodes.BAD_REQUEST);

        const problem: Problem = {
            id: generateSnowflake(),
            contest_id: contest.id,
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

ProblemHandler.delete("/:problem_id", async (req, res) => {
    const problem = await extractModifiableProblem(req);

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
        submissions.map(async (submission) => {
            const clusterSubmissions = await Database.selectFrom(
                "cluster_submissions",
                "*",
                {
                    submission_id: submission.id,
                }
            );

            await Database.deleteFrom("cluster_submissions", "*", {
                submission_id: submission.id,
            });

            await Promise.all(
                clusterSubmissions.map((cs) =>
                    Database.deleteFrom("testcase_submissions", "*", {
                        cluster_submission_id: cs.id,
                    })
                )
            );
        })
    );

    return respond(res, StatusCodes.OK);
});

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
    useValidation(clusterSchema),
    async (req, res) => {
        const problem = await extractModifiableProblem(req);

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

ProblemHandler.delete("/cluster/:cluster_id", async (req, res) => {
    const cluster = await extractModifiableCluster(req);

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
});

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
    useValidation(testcaseSchema),
    async (req, res) => {
        const cluster = await extractModifiableCluster(req);

        const testcase: Testcase = {
            id: generateSnowflake(),
            cluster_id: cluster.id,
            input: req.body.input,
            correct_output: req.body.correctOutput,
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

ProblemHandler.delete("/testcase/:testcase_id", async (req, res) => {
    const testcase = await extractModifiableTestcase(req);

    await Database.deleteFrom("testcases", "*", { id: testcase.id });
    await Database.deleteFrom("testcase_submissions", "*", {
        testcase_id: testcase.id,
    });

    return respond(res, StatusCodes.OK);
});

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
    useValidation(getSchema, { query: true }),
    async (req, res) => {
        const contestId = BigInt(req.query.contest_id as string);

        await extractContest(req, contestId);

        const problems = await Database.selectFrom("problems", "*", {
            contest_id: contestId,
        });

        // cancer
        // still cancer but now with extractors
        const allowedProblems = (
            await Promise.all(
                problems.map((problem) => {
                    return [
                        problem,
                        (async (): Promise<boolean> => {
                            try {
                                await extractProblem(req, problem.id);
                            } catch {
                                return false;
                            }

                            return true;
                        })(),
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

ProblemHandler.get("/:problem_id", async (req, res) => {
    const problem = await extractProblem(req);

    return respond(res, StatusCodes.OK, problem);
});

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

ProblemHandler.get("/cluster/:problem_id", async (req, res) => {
    const problem = await extractProblem(req);

    const clusters = await Database.selectFrom("clusters", "*", {
        problem_id: problem.id,
    });

    return respond(res, StatusCodes.OK, clusters);
});

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

ProblemHandler.get("/testcase/:cluster_id", async (req, res) => {
    const cluster = await extractCluster(req);

    const testcases = await Database.selectFrom("testcases", "*", {
        cluster_id: cluster.id,
    });

    return respond(res, StatusCodes.OK, testcases);
});

export default ProblemHandler;
