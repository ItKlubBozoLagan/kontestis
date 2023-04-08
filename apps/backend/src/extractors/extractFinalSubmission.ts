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
import { extractIdFromParameters } from "../utils/extractorUtils";
import { extractContestMember } from "./extractContestMember";
import { extractUser } from "./extractUser";
import { memoizedRequestExtractor } from "./MemoizedRequestExtractor";

export const extractFinalSubmission = async (
    req: Request,
    finalSubmissionId: Snowflake = extractIdFromParameters(req, "final_submission_id")
) => {
    return await memoizedRequestExtractor(
        req,
        `__final_submission_${finalSubmissionId}`,
        async () => {
            const finalSubmission = await Database.selectOneFrom("exam_final_submissions", "*", {
                id: finalSubmissionId,
            });

            if (!finalSubmission) throw new SafeError(StatusCodes.NOT_FOUND);

            const user = await extractUser(req);

            if (user.id === finalSubmission.user_id) return finalSubmission;

            if (hasAdminPermission(user.permissions, AdminPermissions.VIEW_CONTEST))
                return finalSubmission;

            const member = await extractContestMember(req, finalSubmission.contest_id);

            if (
                hasContestPermission(
                    member.contest_permissions,
                    ContestMemberPermissions.VIEW_PRIVATE
                )
            )
                return finalSubmission;

            throw new SafeError(StatusCodes.NOT_FOUND);
        }
    );
};
