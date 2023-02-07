import { Snowflake } from "@kontestis/models";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import {
    AdminPermissions,
    hasAdminPermission,
} from "../permissions/AdminPermissions";
import { extractIdFromParameters } from "../utils/extractorUtils";
import { extractUser } from "./extractUser";
import { memoizedRequestExtractor } from "./MemoizedRequestExtractor";

export const extractContest = (req: Request, optionalContestId?: Snowflake) => {
    const contestId =
        optionalContestId ?? extractIdFromParameters(req, "contest_id");

    return memoizedRequestExtractor(req, `__contest_${contestId}`, async () => {
        const contest = await Database.selectOneFrom("contests", "*", {
            id: contestId,
        });

        if (!contest) throw new SafeError(StatusCodes.NOT_FOUND);

        if (contest.public) return contest;

        const user = await extractUser(req);

        if (hasAdminPermission(user.permissions, AdminPermissions.VIEW_CONTEST))
            return contest;

        if (user.id == contest.admin_id) return contest;

        const allowedUser = await Database.selectOneFrom(
            "allowed_users",
            ["id"],
            {
                user_id: user.id,
                contest_id: contest.id,
            }
        );

        if (!allowedUser) throw new SafeError(StatusCodes.NOT_FOUND);

        return contest;
    });
};
