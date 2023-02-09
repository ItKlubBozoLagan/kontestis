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
}

export const hasContestPermission = (
    data: PermissionData,
    permission: ContestMemberPermissions
) => {
    return hasPermission(data, ContestMemberPermissions.ADMIN) || hasPermission(data, permission);
};
