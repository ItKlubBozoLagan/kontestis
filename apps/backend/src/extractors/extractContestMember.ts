import { ContestMemberPermissions, hasContestPermission, Snowflake } from "@kontestis/models";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { extractIdFromParameters } from "../utils/extractorUtils";
import { extractUser } from "./extractUser";
import { memoizedRequestExtractor } from "./MemoizedRequestExtractor";

export const extractContestMember = (
    req: Request,
    contestId: Snowflake = extractIdFromParameters(req, "contest_id")
) =>
    memoizedRequestExtractor(req, `__contest_member_${contestId}`, async () => {
        const user = await extractUser(req);
        const member = await Database.selectOneFrom("contest_members", "*", {
            user_id: user.id,
            contest_id: contestId,
        });

        if (!member) throw new SafeError(StatusCodes.NOT_FOUND);

        if (!hasContestPermission(member.contest_permissions, ContestMemberPermissions.VIEW))
            throw new SafeError(StatusCodes.FORBIDDEN);

        return member;
    });
