import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { Snowflake } from "../lib/snowflake";
import { extractIdFromParameters } from "../utils/extractorUtils";
import { extractContest } from "./extractContest";
import { extractModifiableContest } from "./extractModifiableContest";
import { extractProblem } from "./extractProblem";
import { extractUser } from "./extractUser";
import { memoizedRequestExtractor } from "./MemoizedRequestExtractor";

export const extractSubmission = (
    req: Request,
    optionalSubmissionId?: Snowflake
) => {
    const submissionId =
        optionalSubmissionId ?? extractIdFromParameters(req, "submission_id");

    return memoizedRequestExtractor(req, "__submission", async () => {
        const submission = await Database.selectOneFrom("submissions", "*", {
            id: submissionId,
        });

        if (!submission) throw new SafeError(StatusCodes.NOT_FOUND);

        const user = await extractUser(req);
        const problem = await extractProblem(req, submission.problem_id);
        const contest = await extractContest(req, problem.contest_id);

        if (user.id === submission.user_id) return submission;

        if (
            Date.now() >=
            contest.start_time.getTime() + 1000 * contest.duration_seconds
        )
            return submission;

        await extractModifiableContest(req, contest.id);

        return submission;
    });
};
