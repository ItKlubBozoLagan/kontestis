import { ContestMemberPermissions, Snowflake } from "@kontestis/models";
import { Request } from "express";

import { mustHaveContestPermission } from "../preconditions/hasPermission";
import { extractContest } from "./extractContest";

export const extractModifiableContest = async (req: Request, contestId?: Snowflake) => {
    const contest = await extractContest(req, contestId);

    await mustHaveContestPermission(req, ContestMemberPermissions.EDIT, contest.id);

    return contest;
};
