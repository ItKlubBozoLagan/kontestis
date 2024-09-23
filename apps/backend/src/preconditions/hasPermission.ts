import {
    AdminPermissions,
    OrganisationPermissionKeys,
    OrganisationPermissions,
    OrganisationToAdminPermissionMap,
} from "@kontestis/models";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";
import { hasPermission } from "permissio";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { extractCurrentOrganisationId } from "../extractors/extractOrganisation";
import { extractUser } from "../extractors/extractUser";
import { extractIdFromParameters } from "../utils/extractorUtils";

export const mustHaveAdminPermission = async (request: Request, permission: AdminPermissions) => {
    if (!(await hasAdminPermission(request, permission)))
        throw new SafeError(StatusCodes.FORBIDDEN);
};

export const hasAdminPermission = async (request: Request, permission: AdminPermissions) => {
    const user = await extractUser(request);

    return (
        hasPermission(user.permissions, AdminPermissions.ADMIN) ||
        hasPermission(user.permissions, permission)
    );
};

export const mustHaveCurrentOrganisationPermission = async (
    req: Request,
    permission: OrganisationPermissions
) => {
    if (!(await hasCurrentOrganisationPermission(req, permission)))
        throw new SafeError(StatusCodes.FORBIDDEN);
};

export const hasCurrentOrganisationPermission = async (
    req: Request,
    permission: OrganisationPermissions
) => {
    return await hasOrganisationPermission(req, permission, extractCurrentOrganisationId(req));
};

export const hasOrganisationPermission = async (
    req: Request,
    permission: OrganisationPermissions,
    organisationId = extractIdFromParameters(req, "organisation_id")
) => {
    const permissionKey = OrganisationPermissions[permission] as OrganisationPermissionKeys;

    if (await hasAdminPermission(req, OrganisationToAdminPermissionMap[permissionKey])) return true;

    const user = await extractUser(req);

    const organisationMember = await Database.selectOneFrom(
        "organisation_members",
        ["permissions"],
        {
            organisation_id: organisationId,
            user_id: user.id,
        }
    );

    if (!organisationMember) return false;

    return (
        hasPermission(organisationMember.permissions, OrganisationPermissions.ADMIN) ||
        hasPermission(organisationMember.permissions, permission)
    );
};
