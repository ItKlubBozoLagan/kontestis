import { Snowflake } from "@kontestis/models";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import {
    AdminPermissions,
    hasAdminPermission,
} from "../../../../packages/models/src/permissions/AdminPermissions";
import { SafeError } from "../errors/SafeError";
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

    if (hasAdminPermission(user.permissions, AdminPermissions.EDIT_CONTEST))
        return contest;

    if (user.id === contest.admin_id) return contest;

    throw new SafeError(StatusCodes.FORBIDDEN);
};
