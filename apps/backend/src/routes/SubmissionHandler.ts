import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import * as R from "remeda";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { extractClusterSubmission } from "../extractors/extractClusterSubmission";
import { extractContest } from "../extractors/extractContest";
import { extractModifiableContest } from "../extractors/extractModifiableContest";
import { extractOptionalUser } from "../extractors/extractOptionalUser";
import { extractProblem } from "../extractors/extractProblem";
import { extractSubmission } from "../extractors/extractSubmission";
import { extractUser } from "../extractors/extractUser";
import { beginEvaluation } from "../lib/evaluation";
import { getAllPendingSubmissions } from "../lib/pendingSubmission";
import { useValidation } from "../middlewares/useValidation";
import { respond } from "../utils/response";

const SubmissionHandler = Router();

const submissionSchema = Type.Object({
    language: Type.Union([Type.Literal("c"), Type.Literal("cpp"), Type.Literal("python")]),
    code: Type.String({ maxLength: 64_000 }),
});

SubmissionHandler.post("/:problem_id", useValidation(submissionSchema), async (req, res) => {
    const problem = await extractProblem(req);
    const user = await extractUser(req);

    const submissionId = await beginEvaluation(user, {
        problemId: problem.id,
        language: req.body.language,
        code: req.body.code,
    });

    return respond(res, StatusCodes.CREATED, { submission: submissionId });
});

// TODO: Permissions return full res!

const getSchema = Type.Object({
    user_id: Type.String(),
});

SubmissionHandler.get("/", useValidation(getSchema, { query: true }), async (req, res) => {
    const submissions = await Database.selectFrom("submissions", ["id"], {
        user_id: req.query.user_id,
    });

    return respond(res, StatusCodes.OK, submissions);
});

SubmissionHandler.get("/by-problem/:problem_id", async (req, res) => {
    const problem = await extractProblem(req);
    const user = await extractOptionalUser(req);
    const contest = await extractContest(req, problem.contest_id);

    if (!req.query.user_id && !user) throw new SafeError(StatusCodes.NOT_FOUND);

    const userId = req.query.user_id ? BigInt(req.query.user_id as string) : user!.id;

    const submissions = await Database.selectFrom(
        "submissions",
        "*",
        {
            problem_id: problem.id,
            user_id: userId,
        },
        "ALLOW FILTERING"
    );

    const pendingSubmissions = await getAllPendingSubmissions({
        userId: userId,
        problemId: problem.id,
    });

    if (!req.query.user_id) {
        // only return pending submissions if the submitter is the user
        const combined = [
            ...R.map(submissions, R.addProp("completed", true)),
            ...R.pipe(
                pendingSubmissions,
                R.map(R.addProp("completed", false)),
                R.filter((it) => submissions.every((submission) => submission.id !== it.id))
            ),
        ];

        return respond(res, StatusCodes.OK, combined);
    }

    if (contest.start_time.getTime() + contest.duration_seconds * 1000 <= Date.now())
        return respond(res, StatusCodes.OK, submissions);

    if (!user) throw new SafeError(StatusCodes.NOT_FOUND);

    await extractModifiableContest(req, problem.contest_id);

    return respond(res, StatusCodes.OK, submissions);
});

SubmissionHandler.get("/:submission_id", async (req, res) => {
    const submission = await extractSubmission(req);

    return respond(res, StatusCodes.OK, submission);
});

SubmissionHandler.get("/cluster/:submission_id", async (req, res) => {
    const submission = await extractSubmission(req);

    const clusters = await Database.selectFrom("cluster_submissions", "*", {
        submission_id: submission.id,
    });

    return respond(res, StatusCodes.OK, clusters);
});

SubmissionHandler.get("/testcase/:cluster_submission_id", async (req, res) => {
    const clusterSubmission = await extractClusterSubmission(req);

    const testcases = await Database.selectFrom("testcase_submissions", "*", {
        cluster_submission_id: clusterSubmission.id,
    });

    return respond(res, StatusCodes.OK, testcases);
});

export default SubmissionHandler;
