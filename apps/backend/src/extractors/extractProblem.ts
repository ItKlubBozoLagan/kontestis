import {
    AdminPermissions,
    ContestMemberPermissions,
    hasAdminPermission,
    hasContestPermission,
    Problem,
    Snowflake,
} from "@kontestis/models";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { extractIdFromParameters } from "../utils/extractorUtils";
import { R } from "../utils/remeda";
import { extractContest } from "./extractContest";
import { extractContestMember } from "./extractContestMember";
import { extractOptionalUser } from "./extractOptionalUser";
import { extractUser } from "./extractUser";
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
                    !hasContestPermission(
                        optionalMember.contest_permissions,
                        ContestMemberPermissions.VIEW_PRIVATE
                    )) &&
                (!optionalUser ||
                    !hasAdminPermission(optionalUser.permissions, AdminPermissions.VIEW_CONTEST))
            )
                return R.omit(problem, [
                    "evaluation_language",
                    "evaluation_script",
                    "solution_language",
                    "solution_code",
                ]);

            const user = await extractUser(req);

            if (hasAdminPermission(user.permissions, AdminPermissions.VIEW_CONTEST)) return problem;

            const member = await extractContestMember(req, problem.contest_id);

            if (
                hasContestPermission(
                    member.contest_permissions,
                    ContestMemberPermissions.VIEW_PRIVATE
                )
            )
                return problem;

            throw new SafeError(StatusCodes.NOT_FOUND);
        }
    );
