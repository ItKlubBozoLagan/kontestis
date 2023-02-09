import { Snowflake } from "@kontestis/models";
import { Request } from "express";

import { extractModifiableContest } from "./extractModifiableContest";
import { extractProblem } from "./extractProblem";

export const extractModifiableProblem = async (req: Request, optionalProblemId?: Snowflake) => {
    const problem = await extractProblem(req, optionalProblemId);

    await extractModifiableContest(req, problem.contest_id);

    return problem;
};
