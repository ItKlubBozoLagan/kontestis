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
import { useValidation } from "../../../middlewares/useValidation";
import { respond } from "../../../utils/response";
import TestcaseHandler from "./testcase/TestcaseHandler";

const ClusterHandler = Router({ mergeParams: true });

ClusterHandler.use("/:cluster_id/testcase", TestcaseHandler);

const clusterSchema = Type.Object({
    awarded_score: Type.Number({ minimum: 1, maximum: 1000 }),
    generator: Type.Boolean(),
    generator_language: Type.Optional(
        Type.Union([Type.Literal("c"), Type.Literal("cpp"), Type.Literal("python")])
    ),
    generator_code: Type.Optional(Type.String()),
});

ClusterHandler.get("/", async (req, res) => {
    const problem = await extractProblem(req);

    const clusters = await Database.selectFrom("clusters", "*", {
        problem_id: problem.id,
    });

    return respond(res, StatusCodes.OK, clusters);
});

ClusterHandler.post("/", useValidation(clusterSchema), async (req, res) => {
    const problem = await extractModifiableProblem(req);

    if (req.body.generator && (!req.body.generator_language || !req.body.generator_code))
        throw new SafeError(StatusCodes.BAD_REQUEST);

    const cluster: Cluster = {
        id: generateSnowflake(),
        problem_id: problem.id,
        awarded_score: req.body.awarded_score,
        generator: req.body.generator,
        generator_code: req.body.generator_code,
        generator_language: req.body.generator_language,
    };

    await Database.insertInto("clusters", cluster);

    return respond(res, StatusCodes.OK, cluster);
});

// eslint-disable-next-line sonarjs/no-duplicate-string
ClusterHandler.get("/:cluster_id", async (req, res) => {
    const cluster = await extractCluster(req);

    return respond(res, StatusCodes.OK, cluster);
});

ClusterHandler.patch("/:cluster_id", useValidation(clusterSchema), async (req, res) => {
    const cluster = await extractModifiableCluster(req);

    if (req.body.generator && (!req.body.generator_language || !req.body.generator_code))
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
