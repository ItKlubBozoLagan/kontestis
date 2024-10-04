import {
    AdminPermissions,
    ContestMemberPermissions,
    hasAdminPermission,
    Problem,
    Snowflake,
} from "@kontestis/models";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { hasContestPermission } from "../preconditions/hasPermission";
import { extractIdFromParameters } from "../utils/extractorUtils";
import { R } from "../utils/remeda";
import { extractContest } from "./extractContest";
import { extractOptionalUser } from "./extractOptionalUser";
import { memoizedRequestExtractor } from "./MemoizedRequestExtractor";

export const extractProblem = (
    req: Request,
    problemId: Snowflake = extractIdFromParameters(req, "problem_id")
) =>
    memoizedRequestExtractor(
        req,
        "__problem_" + problemId,
        async (): Promise<
            | Problem
            | Omit<
                  Problem,
                  | "evaluation_language"
                  | "evaluation_script"
                  | "solution_language"
                  | "solution_code"
              >
        > => {
            const problem = await Database.selectOneFrom("problems", "*", {
                id: problemId,
            });

            if (!problem) throw new SafeError(StatusCodes.NOT_FOUND);

            const contest = await extractContest(req, problem.contest_id);

            // TODO: Find a better way of doing this
            const optionalUser = await extractOptionalUser(req);

            const optionalMember =
                optionalUser &&
                (await Database.selectOneFrom("contest_members", "*", {
                    contest_id: contest.id,
                    user_id: optionalUser.id,
                }));

            if (
                Date.now() >= contest.start_time.getTime() &&
                (!optionalMember ||
                    !(await hasContestPermission(
                        req,
                        ContestMemberPermissions.VIEW_PRIVATE,
                        contest.id
                    ))) &&
                (!optionalUser ||
                    !hasAdminPermission(optionalUser.permissions, AdminPermissions.VIEW_CONTEST))
            )
                return R.omit(problem, [
                    "evaluation_language",
                    "evaluation_script",
                    "solution_language",
                    "solution_code",
                ]);

            if (await hasContestPermission(req, ContestMemberPermissions.VIEW_PRIVATE, contest.id))
                return problem;

            throw new SafeError(StatusCodes.NOT_FOUND);
        }
    );
