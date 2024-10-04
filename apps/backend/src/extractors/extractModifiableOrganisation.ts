import { OrganisationPermissions, Snowflake } from "@kontestis/models";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { SafeError } from "../errors/SafeError";
import { mustHaveOrganisationPermission } from "../preconditions/hasPermission";
import { extractOrganisation } from "./extractOrganisation";

export const extractModifiableOrganisation = async (req: Request, organisationId?: Snowflake) => {
    const organisation = await extractOrganisation(req, organisationId);

    await mustHaveOrganisationPermission(req, OrganisationPermissions.ADMIN, organisation.id);

    throw new SafeError(StatusCodes.FORBIDDEN);
};
