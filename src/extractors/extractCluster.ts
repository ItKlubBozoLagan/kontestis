import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { Snowflake } from "../lib/snowflake";
import { extractIdFromParams as extractIdFromParameters } from "../utils/extractorUtils";
import { extractModifiableProblem } from "./extractModifiableProblem";
import { memoizedRequestExtractor } from "./MemoizedRequestExtractor";

export const extractCluster = async (
    req: Request,
    optionalClusterId?: Snowflake
) => {
    const clusterId =
        optionalClusterId ?? extractIdFromParameters(req, "cluster_id");

    return memoizedRequestExtractor(req, "__cluster_" + clusterId, async () => {
        const cluster = await Database.selectOneFrom("clusters", "*", {
            id: clusterId,
        });

        if (!cluster) throw new SafeError(StatusCodes.NOT_FOUND);

        await extractModifiableProblem(req, cluster.problem_id);

        return cluster;
    });
};
