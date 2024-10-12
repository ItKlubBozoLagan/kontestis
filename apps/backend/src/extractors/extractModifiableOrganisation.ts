import { OrganisationPermissions, Snowflake } from "@kontestis/models";
import { Request } from "express";

import { mustHaveOrganisationPermission } from "../preconditions/hasPermission";
import { extractOrganisation } from "./extractOrganisation";

export const extractModifiableOrganisation = async (req: Request, organisationId?: Snowflake) => {
    const organisation = await extractOrganisation(req, organisationId);

    await mustHaveOrganisationPermission(req, OrganisationPermissions.ADMIN, organisation.id);

    return organisation;
};
