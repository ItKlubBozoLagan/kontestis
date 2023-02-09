import { ContestMemberPermissions, hasContestPermission, Snowflake } from "@kontestis/models";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import {
    AdminPermissions,
    hasAdminPermission,
} from "../../../../packages/models/src/permissions/AdminPermissions";
import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { extractIdFromParameters } from "../utils/extractorUtils";
import { extractUser } from "./extractUser";
import { memoizedRequestExtractor } from "./MemoizedRequestExtractor";

export const extractContest = (req: Request, optionalContestId?: Snowflake) => {
    const contestId = optionalContestId ?? extractIdFromParameters(req, "contest_id");

    return memoizedRequestExtractor(req, `__contest_${contestId}`, async () => {
        const contest = await Database.selectOneFrom("contests", "*", {
            id: contestId,
        });

        if (!contest) throw new SafeError(StatusCodes.NOT_FOUND);

        if (contest.public) return contest;

        const user = await extractUser(req);

        if (hasAdminPermission(user.permissions, AdminPermissions.VIEW_CONTEST)) return contest;

        const contestUser = await Database.selectOneFrom("contest_members", "*", {
            contest_id: contest.id,
            user_id: user.id,
        });

        if (!contestUser) throw new SafeError(StatusCodes.NOT_FOUND);

        if (!hasContestPermission(contestUser.contest_permissions, ContestMemberPermissions.VIEW))
            throw new SafeError(StatusCodes.NOT_FOUND);

        return contest;
    });
};
