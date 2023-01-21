import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { Snowflake } from "../lib/snowflake";
import { extractIdFromParameters } from "../utils/extractorUtils";
import { extractContest } from "./extractContest";
import { extractModifiableProblem } from "./extractModifiableProblem";
import { extractProblem } from "./extractProblem";
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

        const problem = await extractProblem(req, cluster.problem_id);
        const contest = await extractContest(req, problem.contest_id);

        if (
            Date.now() >=
            contest.start_time.getTime() + 1000 * contest.duration_seconds
        )
            return cluster;

        await extractModifiableProblem(req, cluster.problem_id);

        return cluster;
    });
};
