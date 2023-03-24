import { AdminPermissions, hasAdminPermission, Organisation, Snowflake } from "@kontestis/models";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { Globals } from "../globals";
import { extractUser } from "./extractUser";
import { memoizedRequestExtractor } from "./MemoizedRequestExtractor";

export const DEFAULT_ORGANISATION: Organisation = {
    id: 1n,
    owner: 1n,
    name: Globals.defaultOrganisationName,
    avatar_url: "",
};

// TODO: Refactor this
// eslint-disable-next-line sonarjs/cognitive-complexity
export const extractOrganisation = (req: Request, optionalOrganisationId?: Snowflake) => {
    const organisationId =
        optionalOrganisationId ??
        (() => {
            const organisationId = req.headers["x-kontestis-org-id"];

            if (!organisationId || typeof organisationId !== "string")
                throw new SafeError(StatusCodes.BAD_REQUEST);

            return BigInt(organisationId);
        })();

    if (organisationId === 1n) return DEFAULT_ORGANISATION;

    return memoizedRequestExtractor(req, "__organisation_" + organisationId, async () => {
        const organisation = await Database.selectOneFrom("organisations", "*", {
            id: organisationId,
        });

        if (!organisation) {
            // Don`t question it
            throw new SafeError(
                optionalOrganisationId ? StatusCodes.NOT_FOUND : StatusCodes.BAD_REQUEST
            );
        }

        const user = await extractUser(req);

        if (hasAdminPermission(user.permissions, AdminPermissions.VIEW_ORGANISATIONS))
            return organisation;

        const organisationMember = await Database.selectOneFrom(
            "organisation_members",
            ["id"],
            {
                organisation_id: organisation.id,
                user_id: user.id,
            },
            "ALLOW FILTERING"
        );

        if (!organisationMember)
            throw new SafeError(
                optionalOrganisationId ? StatusCodes.NOT_FOUND : StatusCodes.BAD_REQUEST
            );

        return organisation;
    });
};
