import { AdminPermissions, hasAdminPermission, Snowflake } from "@kontestis/models";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { extractUser } from "./extractUser";
import { memoizedRequestExtractor } from "./MemoizedRequestExtractor";

export const extractOrganisation = (req: Request, optionalOrganisationId?: Snowflake) => {
    const organisationId =
        optionalOrganisationId ??
        (() => {
            const organisationId = req.headers["X-Kontestis-Org-Id"];

            if (!organisationId || typeof organisationId !== "string")
                throw new SafeError(StatusCodes.BAD_REQUEST);

            return organisationId;
        })();

    return memoizedRequestExtractor(req, "__organisation_" + organisationId, async () => {
        const organisation = await Database.selectOneFrom("organisations", "*", {
            id: organisationId,
        });

        if (!organisation)
            // Don`t question it
            throw new SafeError(
                optionalOrganisationId ? StatusCodes.NOT_FOUND : StatusCodes.BAD_REQUEST
            );

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
