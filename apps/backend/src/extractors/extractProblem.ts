import {
    AdminPermissions,
    ContestMemberPermissions,
    hasAdminPermission,
    hasContestPermission,
    Snowflake,
} from "@kontestis/models";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";
import * as R from "remeda";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { extractIdFromParameters } from "../utils/extractorUtils";
import { extractContest } from "./extractContest";
import { extractContestMember } from "./extractContestMember";
import { extractUser } from "./extractUser";
import { memoizedRequestExtractor } from "./MemoizedRequestExtractor";

export const extractProblem = (
    req: Request,
    problemId: Snowflake = extractIdFromParameters(req, "problem_id")
) =>
    memoizedRequestExtractor(req, "__problem_" + problemId, async () => {
        const problem = await Database.selectOneFrom("problems", "*", {
            id: problemId,
        });

        if (!problem) throw new SafeError(StatusCodes.NOT_FOUND);

        const contest = await extractContest(req, problem.contest_id);

        if (Date.now() >= contest.start_time.getTime())
            return R.omit(problem, ["evaluation_script"]);

        const user = await extractUser(req);

        if (hasAdminPermission(user.permissions, AdminPermissions.VIEW_CONTEST)) return problem;

        const member = await extractContestMember(req, problem.contest_id);

        if (hasContestPermission(member.contest_permissions, ContestMemberPermissions.VIEW_PRIVATE))
            return problem;

        throw new SafeError(StatusCodes.NOT_FOUND);
    });
