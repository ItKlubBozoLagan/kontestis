import { ContestMemberPermissions, Snowflake } from "@kontestis/models";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { mustHaveContestPermission } from "../preconditions/hasPermission";
import { extractIdFromParameters } from "../utils/extractorUtils";
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

            await mustHaveContestPermission(
                req,
                ContestMemberPermissions.VIEW_PRIVATE,
                finalSubmission.contest_id
            );

            throw new SafeError(StatusCodes.NOT_FOUND);
        }
    );
};
