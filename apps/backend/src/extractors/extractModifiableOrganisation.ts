import { AdminPermissions, hasAdminPermission, Snowflake } from "@kontestis/models";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { SafeError } from "../errors/SafeError";
import { extractOrganisation } from "./extractOrganisation";
import { extractUser } from "./extractUser";

export const extractModifiableOrganisation = async (
    req: Request,
    optionalOrganisationId?: Snowflake
) => {
    const user = await extractUser(req);
    const organisation = await extractOrganisation(req, optionalOrganisationId);

    if (
        hasAdminPermission(user.permissions, AdminPermissions.EDIT_ORGANISATIONS) ||
        user.id === organisation.owner
    )
        return organisation;

    throw new SafeError(StatusCodes.FORBIDDEN);
};
