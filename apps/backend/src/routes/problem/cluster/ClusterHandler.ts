import { Cluster } from "@kontestis/models";
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
    awarded_score: Type.Number({ minimum: 1, maximum: 1_000_000 }),
    order_number: Type.Optional(Type.Number({ minimum: 0 })),
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

    const cluster: Cluster = {
        id: generateSnowflake(),
        problem_id: problem.id,
        awarded_score: req.body.awarded_score,
        status: "not-ready",
        order_number: BigInt(clusters.length),
    };

    await Database.insertInto("clusters", cluster);

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

    await Database.update("clusters", { status: "not-ready" }, { id: cluster.id });

    const testcases = await Database.selectFrom("testcases", "*", {
        cluster_id: cluster.id,
    });

    await Promise.all(
        testcases
            .filter((testcase) => testcase.input_type === "auto" || testcase.output_type === "auto")
            .map((testcase) =>
                Database.update("testcases", { status: "not-ready" }, { id: testcase.id })
            )
    );

    await Database.update("clusters", { status: "not-ready" }, { id: cluster.id });

    const _ = assureClusterGeneration({
        ...cluster,
        status: "not-ready",
    });

    return respond(res, StatusCodes.OK);
});

ClusterHandler.patch("/:cluster_id", useValidation(ClusterSchema), async (req, res) => {
    const cluster = await extractModifiableCluster(req);

    const updateData: Partial<Cluster> = {
        awarded_score: req.body.awarded_score,
    };

    if (req.body.order_number !== undefined) {
        updateData.order_number = req.body.order_number;
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
