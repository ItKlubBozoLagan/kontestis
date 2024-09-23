import { Snowflake } from "@kontestis/models";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { extractIdFromParameters } from "../utils/extractorUtils";
import { extractUser } from "./extractUser";
import { memoizedRequestExtractor } from "./MemoizedRequestExtractor";

export const extractOrganisationMember = (
    req: Request,
    organisationId: Snowflake = extractIdFromParameters(req, "organisation_id")
) => {
    return memoizedRequestExtractor(req, "__organisation_member_" + organisationId, async () => {
        const user = await extractUser(req);

        const organisationMember = await Database.selectOneFrom("organisation_members", "*", {
            organisation_id: organisationId,
            user_id: user.id,
        });

        if (!organisationMember) throw new SafeError(StatusCodes.NOT_FOUND);

        return organisationMember;
    });
};
