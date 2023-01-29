import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { SafeError } from "../errors/SafeError";
import { Snowflake } from "../lib/snowflake";
import {
    AdministrativePermissions,
    hasAdminPermission,
} from "../types/AdministrativePermissions";
import { extractContest } from "./extractContest";
import { extractUser } from "./extractUser";

export const extractModifiableContest = async (
    req: Request,
    contestId?: Snowflake
) => {
    const [user, contest] = await Promise.all([
        extractUser(req),
        extractContest(req, contestId),
    ]);

    if (
        hasAdminPermission(
            user.permissions,
            AdministrativePermissions.EDIT_CONTEST
        )
    )
        return contest;

    if (user.id === contest.admin_id) return contest;

    throw new SafeError(StatusCodes.FORBIDDEN);
};