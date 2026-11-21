import {
    AdminPermissions,
    ContestMemberPermissionKeys,
    ContestMemberPermissions,
    ContestMemberToOrganisationPermissionMap,
    type FullUser,
    hasAdminPermission,
    hasContestPermission,
    OrganisationPermissionKeys,
    OrganisationPermissions,
    OrganisationToAdminPermissionMap,
} from "@kontestis/models";
import { hasPermission, type PermissionData } from "permissio";

export const isAdmin = (user: FullUser, permission = AdminPermissions.ADMIN) =>
    hasAdminPermission(user.permissions, permission);

/** Mirrors `hasOrganisationPermission` in the backend's preconditions. UI hint only. */
export const canInOrganisation = (
    user: FullUser,
    memberPermissions: PermissionData | null | undefined,
    permission: OrganisationPermissions
) => {
    const key = OrganisationPermissions[permission] as OrganisationPermissionKeys;

    if (hasAdminPermission(user.permissions, OrganisationToAdminPermissionMap[key])) return true;

    if (memberPermissions === null || memberPermissions === undefined) return false;

    return (
        hasPermission(memberPermissions, OrganisationPermissions.ADMIN) ||
        hasPermission(memberPermissions, permission)
    );
};

/** Mirrors `hasContestPermission` in the backend's preconditions. UI hint only. */
export const canInContest = (
    user: FullUser,
    contestPermissions: PermissionData | null | undefined,
    organisationPermissions: PermissionData | null | undefined,
    permission: ContestMemberPermissions
) => {
    const key = ContestMemberPermissions[permission] as ContestMemberPermissionKeys;

    if (
        canInOrganisation(
            user,
            organisationPermissions,
            ContestMemberToOrganisationPermissionMap[key]
        )
    )
        return true;

    if (contestPermissions === null || contestPermissions === undefined) return false;

    return hasContestPermission(contestPermissions, permission);
};
