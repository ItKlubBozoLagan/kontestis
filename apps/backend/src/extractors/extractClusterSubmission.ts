import { Snowflake } from "@kontestis/models";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { extractIdFromParameters } from "../utils/extractorUtils";
import { extractSubmission } from "./extractSubmission";
import { memoizedRequestExtractor } from "./MemoizedRequestExtractor";

export const extractClusterSubmission = (
    req: Request,
    clusterSubmissionId: Snowflake = extractIdFromParameters(req, "cluster_submission_id")
) =>
    memoizedRequestExtractor(req, `__cluster_submission_${clusterSubmissionId}`, async () => {
        const clusterSubmission = await Database.selectOneFrom("cluster_submissions", "*", {
            id: clusterSubmissionId,
        });

        if (!clusterSubmission) throw new SafeError(StatusCodes.NOT_FOUND);

        await extractSubmission(req, clusterSubmission.submission_id);

        return clusterSubmission;
    });
