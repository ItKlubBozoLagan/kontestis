import { ContestMemberPermissions, Snowflake } from "@kontestis/models";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { mustHaveContestPermission } from "../preconditions/hasPermission";
import { extractIdFromParameters } from "../utils/extractorUtils";
import { memoizedRequestExtractor } from "./MemoizedRequestExtractor";

export const extractContest = (
    req: Request,
    contestId: Snowflake = extractIdFromParameters(req, "contest_id")
) =>
    memoizedRequestExtractor(req, `__contest_${contestId}`, async () => {
        const contest = await Database.selectOneFrom("contests", "*", {
            id: contestId,
        });

        if (!contest) throw new SafeError(StatusCodes.NOT_FOUND);

        if (contest.public) return contest;

        await mustHaveContestPermission(req, ContestMemberPermissions.VIEW, contest.id);

        return contest;
    });
