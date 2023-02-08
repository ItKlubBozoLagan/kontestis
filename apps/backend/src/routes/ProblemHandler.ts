import { Cluster, Problem, Testcase } from "@kontestis/models";
import { filterAsync } from "@kontestis/utils";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import * as R from "remeda";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { extractCluster } from "../extractors/extractCluster";
import { extractContest } from "../extractors/extractContest";
import { extractModifiableCluster } from "../extractors/extractModifiableCluster";
import { extractModifiableContest } from "../extractors/extractModifiableContest";
import { extractModifiableProblem } from "../extractors/extractModifiableProblem";
import { extractModifiableTestcase } from "../extractors/extractModifiableTestcase";
import { extractProblem } from "../extractors/extractProblem";
import { extractUser } from "../extractors/extractUser";
import { generateSnowflake } from "../lib/snowflake";
import { useValidation } from "../middlewares/useValidation";
import { respond } from "../utils/response";

const ProblemHandler = Router();

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

ProblemHandler.get(
    "/",
    useValidation(getSchema, { query: true }),
    async (req, res) => {
        const contestId = BigInt(req.query.contest_id as string);

        await extractContest(req, contestId);

        const problems = await Database.selectFrom("problems", "*", {
            contest_id: contestId,
        });

        const allowedProblems = await filterAsync(problems, ({ id }) =>
            extractProblem(req, id)
                .then(() => true)
                .catch(() => false)
        );

        return respond(
            res,
            StatusCodes.OK,
            await Promise.all(
                allowedProblems.map(async (problem) => {
                    const clusters = await Database.selectFrom(
                        "clusters",
                        "*",
                        {
                            problem_id: problem.id,
                        }
                    );
                    const score = clusters.reduce(
                        (accumulator, current) =>
                            accumulator + current.awarded_score,
                        0
                    );

                    return R.addProp(problem, "score", score);
                })
            )
        );
    }
);

ProblemHandler.get("/scores", async (req, res) => {
    const user = await extractUser(req);

    const submissions = await Database.selectFrom("submissions", "*", {
        user_id: user.id,
    });

    const problemScores: Record<string, number> = {};

    for (const s of submissions) {
        problemScores[s.problem_id + ""] = Math.max(
            s.awarded_score,
            problemScores[s.problem_id + ""] ?? 0
        );
    }

    return respond(res, StatusCodes.OK, problemScores);
});

ProblemHandler.get("/score/:problem_id", async (req, res) => {
    const user = await extractUser(req);
    const problem = await extractProblem(req);

    const submissions = await Database.selectFrom("submissions", "*", {
        user_id: user.id,
        problem_id: problem.id,
    });

    let score = 0;

    for (const s of submissions) score = Math.max(score, s.awarded_score);

    return respond(res, StatusCodes.OK, {
        score,
    });
});

ProblemHandler.get("/:problem_id", async (req, res) => {
    const problem = await extractProblem(req);

    const clusters = await Database.selectFrom("clusters", ["awarded_score"], {
        problem_id: problem.id,
    });
    const score = clusters.reduce(
        (accumulator, current) => accumulator + current.awarded_score,
        0
    );

    return respond(res, StatusCodes.OK, R.addProp(problem, "score", score));
});

ProblemHandler.get("/cluster/:problem_id", async (req, res) => {
    const problem = await extractProblem(req);

    const clusters = await Database.selectFrom("clusters", "*", {
        problem_id: problem.id,
    });

    return respond(res, StatusCodes.OK, clusters);
});

ProblemHandler.get("/testcase/:cluster_id", async (req, res) => {
    const cluster = await extractCluster(req);

    const testcases = await Database.selectFrom("testcases", "*", {
        cluster_id: cluster.id,
    });

    return respond(res, StatusCodes.OK, testcases);
});

export default ProblemHandler;
