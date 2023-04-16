import { Cluster } from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../../../database/Database";
import { SafeError } from "../../../errors/SafeError";
import { extractCluster } from "../../../extractors/extractCluster";
import { extractModifiableCluster } from "../../../extractors/extractModifiableCluster";
import { extractModifiableProblem } from "../../../extractors/extractModifiableProblem";
import { extractProblem } from "../../../extractors/extractProblem";
import { generateSnowflake } from "../../../lib/snowflake";
import { generateTestcaseBatch, getClusterStatus } from "../../../lib/testcase";
import { useValidation } from "../../../middlewares/useValidation";
import { Redis } from "../../../redis/Redis";
import { RedisKeys } from "../../../redis/RedisKeys";
import { EvaluationLanguageSchema } from "../../../utils/evaluation.schema";
import { R } from "../../../utils/remeda";
import { respond } from "../../../utils/response";
import TestcaseHandler from "./testcase/TestcaseHandler";

const ClusterHandler = Router({ mergeParams: true });

ClusterHandler.use("/:cluster_id/testcase", TestcaseHandler);

const ClusterSchema = Type.Object({
    awarded_score: Type.Number({ minimum: 1, maximum: 1000 }),
    generator: Type.Boolean(),
    generator_language: Type.Optional(EvaluationLanguageSchema),
    generator_code: Type.Optional(Type.String()),
});

ClusterHandler.get("/", async (req, res) => {
    const problem = await extractProblem(req);

    const clusters = await Promise.all(
        R.map(
            await Database.selectFrom("clusters", "*", {
                problem_id: problem.id,
            }),
            async (cluster) => R.addProp(cluster, "status", await getClusterStatus(cluster.id))
        )
    );

    return respond(res, StatusCodes.OK, clusters);
});

ClusterHandler.post("/", useValidation(ClusterSchema), async (req, res) => {
    const problem = await extractModifiableProblem(req);

    if (
        req.body.generator &&
        (!req.body.generator_language || req.body.generator_code === undefined)
    )
        throw new SafeError(StatusCodes.BAD_REQUEST);

    const cluster: Cluster = {
        id: generateSnowflake(),
        problem_id: problem.id,
        awarded_score: req.body.awarded_score,
        generator: req.body.generator,
        generator_code: req.body.generator_code ?? "",
        generator_language: req.body.generator_language ?? "python",
    };

    await Database.insertInto("clusters", cluster);

    return respond(res, StatusCodes.OK, cluster);
});

// eslint-disable-next-line sonarjs/no-duplicate-string
ClusterHandler.get("/:cluster_id", async (req, res) => {
    const cluster = await extractCluster(req);

    return respond(
        res,
        StatusCodes.OK,
        R.addProp(cluster, "status", await getClusterStatus(cluster.id))
    );
});

ClusterHandler.post("/:cluster_id/cache/drop", async (req, res) => {
    const cluster = await extractModifiableCluster(req);

    await Redis.set(RedisKeys.CLUSTER_STATUS(cluster.id), "uncached");

    return respond(res, StatusCodes.OK);
});

ClusterHandler.post("/:cluster_id/cache/regenerate", async (req, res) => {
    const cluster = await extractModifiableCluster(req);

    await Redis.set(RedisKeys.CLUSTER_STATUS(cluster.id), "pending");

    // TODO: fix count here
    const _ = generateTestcaseBatch(cluster, 10);

    return respond(res, StatusCodes.OK);
});

ClusterHandler.patch("/:cluster_id", useValidation(ClusterSchema), async (req, res) => {
    const cluster = await extractModifiableCluster(req);

    if (
        req.body.generator &&
        (!req.body.generator_language || req.body.generator_code === undefined)
    )
        throw new SafeError(StatusCodes.BAD_REQUEST);

    await Database.update(
        "clusters",
        {
            awarded_score: req.body.awarded_score,
            generator: req.body.generator,
            generator_language: req.body.generator_language,
            generator_code: req.body.generator_code,
        },
        { id: cluster.id }
    );

    return respond(res, StatusCodes.OK);
});

ClusterHandler.delete("/:cluster_id", async (req, res) => {
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

export default ClusterHandler;
