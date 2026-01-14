import { Cluster, Testcase } from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../../../database/Database";
import { extractCluster } from "../../../extractors/extractCluster";
import { extractModifiableCluster } from "../../../extractors/extractModifiableCluster";
import { extractModifiableProblem } from "../../../extractors/extractModifiableProblem";
import { extractProblem } from "../../../extractors/extractProblem";
import { generateSnowflake } from "../../../lib/snowflake";
import { assureClusterGeneration } from "../../../lib/testcase";
import { useValidation } from "../../../middlewares/useValidation";
import { respond } from "../../../utils/response";
import TestcaseHandler from "./testcase/TestcaseHandler";

const ClusterHandler = Router({ mergeParams: true });

ClusterHandler.use("/:cluster_id/testcase", TestcaseHandler);

// TODO: Order
const ClusterSchema = Type.Object({
    awarded_score: Type.Number({ minimum: 0, maximum: 1_000_000 }),
    order_number: Type.Optional(Type.Number({ minimum: 0 })),
    generator_id: Type.Optional(Type.String()),
    test_count: Type.Optional(Type.Number({ minimum: 1, maximum: 1000 })),
    is_sample: Type.Optional(Type.Boolean()),
});

ClusterHandler.get("/", async (req, res) => {
    const problem = await extractProblem(req);

    const clusters = await Database.selectFrom("clusters", "*", {
        problem_id: problem.id,
    });

    return respond(res, StatusCodes.OK, clusters);
});

ClusterHandler.post("/", useValidation(ClusterSchema), async (req, res) => {
    const problem = await extractModifiableProblem(req);

    const clusters = await Database.selectFrom("clusters", ["id"], { problem_id: problem.id });

    const isSample = req.body.is_sample ?? false;

    const cluster: Cluster = {
        id: generateSnowflake(),
        problem_id: problem.id,
        awarded_score: isSample ? 0 : req.body.awarded_score,
        status: "not-ready",
        order_number: BigInt(clusters.length),
        is_sample: isSample,
    };

    await Database.insertInto("clusters", cluster);

    if (req.body.generator_id && req.body.test_count) {
        const generatorId = BigInt(req.body.generator_id);
        const testCount = req.body.test_count;

        const generator = await Database.selectOneFrom("generators", ["id"], {
            id: generatorId,
            problem_id: problem.id,
        });

        if (!generator) {
            await Database.deleteFrom("clusters", "*", { id: cluster.id });

            return respond(res, StatusCodes.BAD_REQUEST, {
                error: "Generator not found",
            });
        }

        const testcases: Testcase[] = [];

        for (let index = 0; index < testCount; index++) {
            const testcase: Testcase = {
                id: generateSnowflake(),
                cluster_id: cluster.id,
                input_type: "generator",
                output_type: "auto",
                status: "not-ready",
                generator_id: generatorId,
                generator_input: String(index + 1),
            };

            testcases.push(testcase);
        }

        await Promise.all(testcases.map((testcase) => Database.insertInto("testcases", testcase)));

        //const _ = assureClusterGeneration(cluster);
    }

    return respond(res, StatusCodes.OK, cluster);
});

// eslint-disable-next-line sonarjs/no-duplicate-string
ClusterHandler.get("/:cluster_id", async (req, res) => {
    const cluster = await extractCluster(req);

    return respond(res, StatusCodes.OK, cluster);
});

ClusterHandler.post("/:cluster_id/cache/drop", async (req, res) => {
    const cluster = await extractModifiableCluster(req);

    await Database.update("clusters", { status: "not-ready" }, { id: cluster.id });

    return respond(res, StatusCodes.OK);
});

ClusterHandler.post("/:cluster_id/cache/regenerate", async (req, res) => {
    const cluster = await extractModifiableCluster(req);

    const testcases = await Database.selectFrom("testcases", "*", {
        cluster_id: cluster.id,
    });

    await Promise.all(
        testcases
            .filter(
                (testcase) => testcase.input_type === "generator" || testcase.output_type === "auto"
            )
            .map((testcase) =>
                Database.update("testcases", { status: "not-ready" }, { id: testcase.id })
            )
    );

    const _ = assureClusterGeneration({
        ...cluster,
        status: "not-ready",
    });

    return respond(res, StatusCodes.OK);
});

ClusterHandler.patch("/:cluster_id", useValidation(ClusterSchema), async (req, res) => {
    const cluster = await extractModifiableCluster(req);

    const isSample = req.body.is_sample ?? cluster.is_sample ?? false;

    const updateData: Partial<Cluster> = {
        awarded_score: isSample ? 0 : req.body.awarded_score,
        is_sample: isSample,
    };

    if (req.body.order_number !== undefined) {
        updateData.order_number = BigInt(req.body.order_number);
    }

    await Database.update("clusters", updateData, { id: cluster.id });

    return respond(res, StatusCodes.OK);
});

ClusterHandler.delete("/:cluster_id", async (req, res) => {
    const cluster = await extractModifiableCluster(req);

    await Database.deleteFrom("clusters", "*", { id: cluster.id });
    const testcases = await Database.selectFrom("testcases", "*", {
        cluster_id: cluster.id,
    });

    await Database.deleteFrom("testcases", "*", { cluster_id: cluster.id });

    // TODO: Recompute submission score
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
