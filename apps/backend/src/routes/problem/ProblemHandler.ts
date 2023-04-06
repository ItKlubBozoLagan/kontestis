import { Problem } from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { isTruthy } from "remeda";

import { Database } from "../../database/Database";
import { SafeError } from "../../errors/SafeError";
import { extractContest } from "../../extractors/extractContest";
import { extractModifiableContest } from "../../extractors/extractModifiableContest";
import { extractModifiableProblem } from "../../extractors/extractModifiableProblem";
import { extractProblem } from "../../extractors/extractProblem";
import { extractUser } from "../../extractors/extractUser";
import { generateSnowflake } from "../../lib/snowflake";
import { useValidation } from "../../middlewares/useValidation";
import { R } from "../../utils/remeda";
import { respond } from "../../utils/response";
import ClusterHandler from "./cluster/ClusterHandler";

const ProblemHandler = Router();

ProblemHandler.use("/:problem_id/cluster", ClusterHandler);

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
    memory_limit_megabytes: Type.Number({ minimum: 32, maximum: 10_240 }),
    solution_language: Type.Union([Type.Literal("c"), Type.Literal("cpp"), Type.Literal("python")]),
    solution_code: Type.String(),
    tags: Type.Optional(Type.Array(Type.String())),
});

ProblemHandler.post("/:contest_id", useValidation(problemSchema), async (req, res) => {
    const contest = await extractModifiableContest(req);

    if (req.body.evaluation_variant != "plain" && !req.body.evaluation_script)
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
        solution_language: req.body.solution_language,
        solution_code: req.body.solution_code,
        tags: req.body.tags ?? [],
    };

    await Database.insertInto("problems", problem);

    return respond(res, StatusCodes.OK, problem);
});

// eslint-disable-next-line sonarjs/no-duplicate-string
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
            const clusterSubmissions = await Database.selectFrom("cluster_submissions", "*", {
                submission_id: submission.id,
            });

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

ProblemHandler.patch("/:problem_id", useValidation(problemSchema), async (req, res) => {
    const problem = await extractModifiableProblem(req);

    if (req.body.evaluation_variant != "plain" && !req.body.evaluation_script)
        throw new SafeError(StatusCodes.BAD_REQUEST);

    await Database.update(
        "problems",
        {
            title: req.body.title,
            description: req.body.description,
            time_limit_millis: req.body.time_limit_millis,
            memory_limit_megabytes: req.body.memory_limit_megabytes,
            evaluation_variant: req.body.evaluation_variant,
            evaluation_script: req.body.evaluation_script,
            solution_language: req.body.solution_language,
            solution_code: req.body.solution_code,
            tags: req.body.tags ?? [],
        },
        { id: problem.id }
    );

    return respond(res, StatusCodes.OK);
});

const getSchema = Type.Object({
    contest_id: Type.String(),
});

ProblemHandler.get("/", useValidation(getSchema, { query: true }), async (req, res) => {
    const contestId = BigInt(req.query.contest_id as string);

    await extractContest(req, contestId);

    const problems = await Database.selectFrom("problems", ["id"], {
        contest_id: contestId,
    });

    const allowedProblems = R.filter(
        await Promise.all(
            problems.map(({ id }) => extractProblem(req, id).catch(() => false as const))
        ),
        isTruthy
    );

    return respond(
        res,
        StatusCodes.OK,
        await Promise.all(
            allowedProblems.map(async (problem) => {
                const clusters = await Database.selectFrom("clusters", "*", {
                    problem_id: problem.id,
                });
                const score = clusters.reduce(
                    (accumulator, current) => accumulator + current.awarded_score,
                    0
                );

                return R.addProp(problem, "score", score);
            })
        )
    );
});

ProblemHandler.get("/scores", async (req, res) => {
    const user = await extractUser(req);

    const submissions = await Database.selectFrom("submissions", "*", {
        user_id: user.id,
    });

    const problemScores: Record<string, number> = {};

    for (const s of submissions) {
        problemScores[s.problem_id.toString()] = Math.max(
            s.awarded_score,
            problemScores[s.problem_id.toString()] ?? 0
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
    const score = clusters.reduce((accumulator, current) => accumulator + current.awarded_score, 0);

    return respond(res, StatusCodes.OK, R.addProp(problem, "score", score));
});

export default ProblemHandler;
