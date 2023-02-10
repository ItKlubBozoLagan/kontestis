import {
    AdminPermissions,
    ContestMemberPermissions,
    hasAdminPermission,
    hasContestPermission,
    Snowflake,
} from "@kontestis/models";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { extractContest } from "./extractContest";
import { extractUser } from "./extractUser";

export const extractModifiableContest = async (req: Request, contestId?: Snowflake) => {
    const [user, contest] = await Promise.all([extractUser(req), extractContest(req, contestId)]);

    if (hasAdminPermission(user.permissions, AdminPermissions.EDIT_CONTEST)) return contest;

    const contestMember = await Database.selectOneFrom("contest_members", "*", {
        user_id: user.id,
        contest_id: contest.id,
    });

    if (!contestMember) throw new SafeError(StatusCodes.FORBIDDEN);

    if (!hasContestPermission(contestMember.contest_permissions, ContestMemberPermissions.EDIT))
        throw new SafeError(StatusCodes.FORBIDDEN);

    return contest;
};
