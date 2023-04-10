import { hasPermission, PermissionData } from "permissio";

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

export type ContestMemberPermissionKeys = keyof typeof ContestMemberPermissions;

export const ContestMemberPermissionNames = ((values = Object.keys(ContestMemberPermissions)) =>
    values.slice(values.length / 2))() as ContestMemberPermissionKeys[];

export const hasContestPermission = (
    data: PermissionData,
    permission: ContestMemberPermissions
) => {
    return hasPermission(data, ContestMemberPermissions.ADMIN) || hasPermission(data, permission);
};
