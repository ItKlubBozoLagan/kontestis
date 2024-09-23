import { AdminPermissions, hasAdminPermission, Organisation, Snowflake } from "@kontestis/models";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { Globals } from "../globals";
import { extractIdFromParameters } from "../utils/extractorUtils";
import { extractUser } from "./extractUser";
import { memoizedRequestExtractor } from "./MemoizedRequestExtractor";

const ORG_HEADER = "X-Kontestis-Org-Id".toLowerCase();

export const DEFAULT_ORGANISATION: Organisation = {
    id: 1n,
    owner: 1n,
    name: Globals.defaultOrganisationName,
    avatar_url: "",
};

export const extractOrganisation = (
    req: Request,
    organisationId: Snowflake = extractIdFromParameters(req, "organisation_id")
) => {
    if (organisationId === DEFAULT_ORGANISATION.id) return DEFAULT_ORGANISATION;

    return memoizedRequestExtractor(req, "__organisation_" + organisationId, async () => {
        const organisation = await Database.selectOneFrom("organisations", "*", {
            id: organisationId,
        });

        if (!organisation) {
            // Don`t question it
            throw new SafeError(organisationId ? StatusCodes.NOT_FOUND : StatusCodes.BAD_REQUEST);
        }

        const user = await extractUser(req);

        if (hasAdminPermission(user.permissions, AdminPermissions.VIEW_ORGANISATIONS))
            return organisation;

        const organisationMember = await Database.selectOneFrom("organisation_members", ["id"], {
            organisation_id: organisation.id,
            user_id: user.id,
        });

        if (!organisationMember)
            throw new SafeError(organisationId ? StatusCodes.NOT_FOUND : StatusCodes.BAD_REQUEST);

        return organisation;
    });
};

export const extractCurrentOrganisation = (req: Request) => {
    const organisationId = req.headers[ORG_HEADER];

    if (!organisationId || typeof organisationId !== "string" || !/\d+/.test(organisationId))
        throw new SafeError(StatusCodes.BAD_REQUEST);

    return extractOrganisation(req, BigInt(organisationId));
};

export const extractCurrentOrganisationId = (req: Request) => {
    const organisationId = req.headers[ORG_HEADER];

    if (!organisationId || typeof organisationId !== "string" || !/\d+/.test(organisationId))
        throw new SafeError(StatusCodes.BAD_REQUEST);

    return BigInt(organisationId);
};
