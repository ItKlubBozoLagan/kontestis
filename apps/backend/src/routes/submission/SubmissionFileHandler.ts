import { ContestMemberPermissions } from "@kontestis/models";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import { extractCluster } from "../../extractors/extractCluster";
import { extractContest } from "../../extractors/extractContest";
import { extractProblem } from "../../extractors/extractProblem";
import { extractSubmission } from "../../extractors/extractSubmission";
import { Globals } from "../../globals";
import { isContestOver } from "../../lib/contest";
import { hasContestPermission, mustHaveContestPermission } from "../../preconditions/hasPermission";
import { S3Client } from "../../s3/S3";
import { respond } from "../../utils/response";

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

    const stream = S3Client.listObjects(
        Globals.s3.buckets.submission_meta,
        `${submission.id}/${req.params.cluster_id}`,
        true
    );

    const files: string[] = [];

    stream.on("data", (data) => files.push(data.name ?? ""));
    stream.on("end", () => respond(res, StatusCodes.OK, files));
});

SubmissionFileHandler.get("/:cluster_id/:testcase_id/in", async (req, res) => {
    const submission = await extractSubmission(req);
    const cluster = await extractCluster(req);
    const problem = await extractProblem(req, submission.problem_id);
    const contest = await extractContest(req, problem.contest_id);

    if (!isContestOver(contest))
        await mustHaveContestPermission(req, ContestMemberPermissions.VIEW_PRIVATE, contest.id);

    const file = await S3Client.getObject(
        Globals.s3.buckets.submission_meta,
        `${submission.id}/${cluster.id}/${req.params.testcase_id}.in`
    );

    res.setHeader(
        // eslint-disable-next-line sonarjs/no-duplicate-string
        "Content-Disposition",
        `attachment; filename="testcase-${req.params.testcase_id}.in"`
    );
    // eslint-disable-next-line sonarjs/no-duplicate-string
    res.setHeader("Content-Type", "application/octet-stream");

    file.pipe(res);
});

SubmissionFileHandler.get("/:cluster_id/:testcase_id/out", async (req, res) => {
    const submission = await extractSubmission(req);
    const cluster = await extractCluster(req);
    const problem = await extractProblem(req, submission.problem_id);
    const contest = await extractContest(req, problem.contest_id);

    if (!isContestOver(contest))
        await mustHaveContestPermission(req, ContestMemberPermissions.VIEW_PRIVATE, contest.id);

    const file = await S3Client.getObject(
        Globals.s3.buckets.submission_meta,
        `${submission.id}/${cluster.id}/${req.params.testcase_id}.out`
    );

    res.setHeader(
        "Content-Disposition",
        `attachment; filename="testcase-${req.params.testcase_id}.out"`
    );
    res.setHeader("Content-Type", "application/octet-stream");

    file.pipe(res);
});

SubmissionFileHandler.get("/:cluster_id/:testcase_id/sout", async (req, res) => {
    const submission = await extractSubmission(req);
    const cluster = await extractCluster(req);
    const problem = await extractProblem(req, submission.problem_id);
    const contest = await extractContest(req, problem.contest_id);

    if (!isContestOver(contest)) {
        await mustHaveContestPermission(req, ContestMemberPermissions.VIEW_PRIVATE, contest.id);
    }

    const file = await S3Client.getObject(
        Globals.s3.buckets.submission_meta,
        `${submission.id}/${cluster.id}/${req.params.testcase_id}.sout`
    );

    res.setHeader(
        "Content-Disposition",
        `attachment; filename="testcase-${req.params.testcase_id}.sout"`
    );
    res.setHeader("Content-Type", "application/octet-stream");

    file.pipe(res);
});

export default SubmissionFileHandler;
