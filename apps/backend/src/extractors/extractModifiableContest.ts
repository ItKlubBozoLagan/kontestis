import {
    AdminPermissions,
    ContestMemberPermissions,
    hasAdminPermission,
    hasContestPermission,
    Snowflake,
} from "@kontestis/models";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { SafeError } from "../errors/SafeError";
import { extractContest } from "./extractContest";
import { extractContestMember } from "./extractContestMember";
import { extractUser } from "./extractUser";

export const extractModifiableContest = async (req: Request, contestId?: Snowflake) => {
    const [user, contest] = await Promise.all([extractUser(req), extractContest(req, contestId)]);

    if (hasAdminPermission(user.permissions, AdminPermissions.EDIT_CONTEST)) return contest;

    const member = await extractContestMember(req, contest.id);

    if (!hasContestPermission(member.contest_permissions, ContestMemberPermissions.EDIT))
        throw new SafeError(StatusCodes.FORBIDDEN);

    return contest;
};
