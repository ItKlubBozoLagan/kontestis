import { ContestMemberPermissions, Snowflake } from "@kontestis/models";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { mustHaveContestPermission } from "../preconditions/hasPermission";
import { extractIdFromParameters } from "../utils/extractorUtils";
import { extractContest } from "./extractContest";
import { extractProblem } from "./extractProblem";
import { memoizedRequestExtractor } from "./MemoizedRequestExtractor";

export const extractCluster = async (
    req: Request,
    clusterId: Snowflake = extractIdFromParameters(req, "cluster_id")
) =>
    memoizedRequestExtractor(req, `__cluster_${clusterId}`, async () => {
        const cluster = await Database.selectOneFrom("clusters", "*", {
            id: clusterId,
        });

        if (!cluster) throw new SafeError(StatusCodes.NOT_FOUND);

        const problem = await extractProblem(req, cluster.problem_id);
        const contest = await extractContest(req, problem.contest_id);

        if (Date.now() >= contest.start_time.getTime() + 1000 * contest.duration_seconds)
            return cluster;

        await mustHaveContestPermission(req, ContestMemberPermissions.VIEW_PRIVATE, contest.id);

        return cluster;
    });
