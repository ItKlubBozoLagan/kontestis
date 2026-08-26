import { ContestMemberPermissions } from "@kontestis/models";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import { SafeError } from "../../errors/SafeError";
import { extractContest } from "../../extractors/extractContest";
import { extractProblem } from "../../extractors/extractProblem";
import { extractSubmission } from "../../extractors/extractSubmission";
import { Globals } from "../../globals";
import { isContestOver } from "../../lib/contest";
import { hasContestPermission, mustHaveContestPermission } from "../../preconditions/hasPermission";
import { Repositories } from "../../repositories/Repositories";
import { respond } from "../../utils/response";
import { s3OfflinePresignGetObject } from "../../utils/s3";

const SubmissionFileHandler = Router({ mergeParams: true });

SubmissionFileHandler.get("/:cluster_id", async (req, res) => {
    const submission = await extractSubmission(req);

    const problem = await extractProblem(req, submission.problem_id);
    const contest = await extractContest(req, problem.contest_id);

    const cluster = await Repositories.clusters.selectOne(["is_sample"], {
        id: BigInt(req.params.cluster_id),
    });

    if (
        !isContestOver(contest) &&
        !(cluster?.is_sample ?? false) &&
        !(await hasContestPermission(req, ContestMemberPermissions.VIEW_PRIVATE, contest.id))
    )
        return respond(res, StatusCodes.OK, []);

    const clusterId = BigInt(req.params.cluster_id);

    const allClusterSubmsissions = await Repositories.cluster_submissions.select(
        ["id", "cluster_id"],
        {
            submission_id: submission.id,
        }
    );

    const clusterSubmission = allClusterSubmsissions.find((cs) => cs.cluster_id === clusterId);

    if (!clusterSubmission) {
        return respond(res, StatusCodes.OK, []);
    }

    // Get testcase submissions with file references
    const testcaseSubmissions = await Repositories.testcase_submissions.select(
        ["testcase_id", "input_file", "output_file", "submission_output_file"],
        {
            cluster_submission_id: clusterSubmission.id,
        }
    );

    const fileNames: string[] = [];

    for (const ts of testcaseSubmissions) {
        if (ts.input_file) {
            fileNames.push(`${ts.testcase_id}.in`);
        }

        if (ts.output_file) {
            fileNames.push(`${ts.testcase_id}.out`);
        }

        if (ts.submission_output_file) {
            fileNames.push(`${ts.testcase_id}.sout`);
        }
    }

    respond(res, StatusCodes.OK, fileNames);
});

SubmissionFileHandler.get("/:cluster_id/:testcase_id/:type", async (req, res) => {
    const { type } = req.params;

    if (type !== "in" && type !== "out" && type !== "sout")
        throw new SafeError(StatusCodes.BAD_REQUEST, "Invalid type");

    const submission = await extractSubmission(req);
    const cluster = await Repositories.clusters.selectOne(["is_sample", "id"], {
        id: BigInt(req.params.cluster_id),
    });

    if (!cluster) {
        throw new SafeError(StatusCodes.NOT_FOUND);
    }

    const problem = await extractProblem(req, submission.problem_id);
    const contest = await extractContest(req, problem.contest_id);

    const testcaseId = BigInt(req.params.testcase_id);

    const isSample = cluster.is_sample ?? false;

    if (!isContestOver(contest) && !isSample)
        await mustHaveContestPermission(req, ContestMemberPermissions.VIEW_PRIVATE, contest.id);

    const clusterSubmission = await Repositories.cluster_submissions.selectOne(
        ["id", "cluster_id"],
        {
            submission_id: submission.id,
            cluster_id: cluster.id,
        }
    );

    if (!clusterSubmission) {
        throw new SafeError(StatusCodes.NOT_FOUND, "Cluster submission not found");
    }

    const testcaseSubmission = await Repositories.testcase_submissions.selectOne(
        ["testcase_id", "input_file", "output_file", "submission_output_file"],
        {
            cluster_submission_id: clusterSubmission.id,
            testcase_id: testcaseId,
        }
    );

    if (!testcaseSubmission) {
        throw new SafeError(StatusCodes.NOT_FOUND, "Testcase submission not found");
    }

    let filePath: string | undefined;
    let bucket: string;

    switch (type) {
        case "in": {
            filePath = testcaseSubmission.input_file;
            bucket = Globals.s3.buckets.testcases;

            break;
        }
        case "out": {
            filePath = testcaseSubmission.output_file;
            bucket = Globals.s3.buckets.testcases;

            break;
        }
        case "sout": {
            filePath = testcaseSubmission.submission_output_file;
            bucket = Globals.s3.buckets.submission_meta;

            break;
        }
    }

    if (!filePath) {
        throw new SafeError(StatusCodes.NOT_FOUND, "File not found");
    }

    const fileUrl = await s3OfflinePresignGetObject(bucket, filePath, 10 * 60, {
        "response-content-disposition": `attachment;filename="testcase-${testcaseId}.${type}"`,
        "response-content-type": "application/octet-stream",
    });

    respond(res, StatusCodes.OK, {
        url: fileUrl,
    });
});

export default SubmissionFileHandler;
