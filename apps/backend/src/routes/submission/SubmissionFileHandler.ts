import { ContestMemberPermissions } from "@kontestis/models";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import { SafeError } from "../../errors/SafeError";
import { extractCluster } from "../../extractors/extractCluster";
import { extractContest } from "../../extractors/extractContest";
import { extractProblem } from "../../extractors/extractProblem";
import { extractSubmission } from "../../extractors/extractSubmission";
import { Globals } from "../../globals";
import { isContestOver } from "../../lib/contest";
import { Logger } from "../../lib/logger";
import { hasContestPermission, mustHaveContestPermission } from "../../preconditions/hasPermission";
import { S3Client } from "../../s3/S3";
import { respond } from "../../utils/response";
import { s3OfflinePresignGetObject } from "../../utils/s3";
import { readBucketStream } from "../../utils/stream";

const SubmissionFileHandler = Router({ mergeParams: true });

SubmissionFileHandler.get("/:cluster_id", async (req, res) => {
    const submission = await extractSubmission(req);

    const problem = await extractProblem(req, submission.problem_id);
    const contest = await extractContest(req, problem.contest_id);

    if (
        !isContestOver(contest) &&
        !(await hasContestPermission(req, ContestMemberPermissions.VIEW_PRIVATE, contest.id))
    )
        return respond(res, StatusCodes.OK, []);

    const files = await readBucketStream(
        S3Client.listObjects(
            Globals.s3.buckets.submission_meta,
            `${submission.id}/${req.params.cluster_id}`,
            true
        )
    ).catch((error) => {
        Logger.error("Failed to read bucket stream", error);
        throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    const fileNames = files.map((it) => it.name).filter(Boolean) as string[];

    respond(res, StatusCodes.OK, fileNames);
});

SubmissionFileHandler.get("/:cluster_id/:testcase_id/:type", async (req, res) => {
    const { type } = req.params;

    if (type !== "in" && type !== "out" && type !== "sout")
        throw new SafeError(StatusCodes.BAD_REQUEST, "Invalid type");

    const submission = await extractSubmission(req);
    const cluster = await extractCluster(req);
    const problem = await extractProblem(req, submission.problem_id);
    const contest = await extractContest(req, problem.contest_id);

    const testcaseId = BigInt(req.params.testcase_id);

    if (!isContestOver(contest))
        await mustHaveContestPermission(req, ContestMemberPermissions.VIEW_PRIVATE, contest.id);

    const fileUrl = await s3OfflinePresignGetObject(
        Globals.s3.buckets.submission_meta,
        `${submission.id}/${cluster.id}/${testcaseId}.${type}`,
        10 * 60,
        {
            "response-content-disposition": `attachment;filename="testcase-${testcaseId}.${type}"`,
            "response-content-type": "application/octet-stream",
        }
    );

    respond(res, StatusCodes.OK, {
        url: fileUrl,
    });
});

export default SubmissionFileHandler;
