import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { Snowflake } from "../lib/snowflake";
import { extractIdFromParams as extractIdFromParameters } from "../utils/extractorUtils";
import { extractContest } from "./extractContest";
import { extractModifiableContest } from "./extractModifiableContest";
import { memoizedRequestExtractor } from "./MemoizedRequestExtractor";

export const extractProblem = (req: Request, optionalProblemId?: Snowflake) => {
    const problemId =
        optionalProblemId ?? extractIdFromParameters(req, "problem_id");

    return memoizedRequestExtractor(req, "__problem_" + problemId, async () => {
        const problem = await Database.selectOneFrom("problems", "*", {
            id: problemId,
        });

        if (!problem) throw new SafeError(StatusCodes.NOT_FOUND);

        const contest = await extractContest(req, problem.contest_id);

        delete problem.evaluation_script;

        if (Date.now() >= contest.start_time.getTime()) return problem;

        await extractModifiableContest(req, problem.contest_id);

        return problem;
    });
};
