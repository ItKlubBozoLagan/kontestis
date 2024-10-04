import { hasPermission, PermissionData } from "permissio";

import { AdminPermissions, hasAdminPermission } from "./AdminPermissions";
import { OrganisationPermissions } from "./OrganisationPermissions";

export enum ContestMemberPermissions {
    ADMIN,
    VIEW,
    VIEW_PRIVATE,
    EDIT,
    ADD_USER,
    REMOVE_USER,
    EDIT_USER_PERMISSIONS,
    VIEW_QUESTIONS,
    ANSWER_QUESTIONS,
    CREATE_ANNOUNCEMENT,
}
export const ContestMemberToOrganisationPermissionMap: Record<
    ContestMemberPermissionKeys,
    OrganisationPermissions
> = {
    ADMIN: OrganisationPermissions.EDIT_CONTEST,
    VIEW: OrganisationPermissions.VIEW_CONTEST,
    VIEW_PRIVATE: OrganisationPermissions.EDIT_CONTEST,
    EDIT: OrganisationPermissions.EDIT_CONTEST,
    ADD_USER: OrganisationPermissions.EDIT_CONTEST,
    REMOVE_USER: OrganisationPermissions.EDIT_CONTEST,
    EDIT_USER_PERMISSIONS: OrganisationPermissions.EDIT_CONTEST,
    VIEW_QUESTIONS: OrganisationPermissions.EDIT_CONTEST,
    ANSWER_QUESTIONS: OrganisationPermissions.EDIT_CONTEST,
    CREATE_ANNOUNCEMENT: OrganisationPermissions.EDIT_CONTEST,
};

export type ContestMemberPermissionKeys = keyof typeof ContestMemberPermissions;

export const ContestMemberPermissionNames = ((values = Object.keys(ContestMemberPermissions)) =>
    values.slice(values.length / 2))() as ContestMemberPermissionKeys[];

export const hasContestPermission = (
    data: PermissionData,
    permission: ContestMemberPermissions,
    adminPermissions?: PermissionData
) => {
    return (
        hasPermission(data, ContestMemberPermissions.ADMIN) ||
        hasPermission(data, permission) ||
        (adminPermissions !== undefined &&
            hasAdminPermission(adminPermissions, AdminPermissions.ADMIN))
    );
};
