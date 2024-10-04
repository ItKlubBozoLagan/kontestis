import { ContestMemberPermissions, Snowflake } from "@kontestis/models";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { mustHaveContestPermission } from "../preconditions/hasPermission";
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

        await mustHaveContestPermission(req, ContestMemberPermissions.VIEW, contestId);

        return member;
    });
