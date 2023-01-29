import { hasPermission, PermissionData } from "permissio";

export enum AdministrativePermissions {
    ADMIN,
    VIEW_USER,
    EDIT_USER,
    DELETE_USER,
    ADD_CONTEST,
    VIEW_CONTEST,
    EDIT_CONTEST,
    DELETE_CONTEST,
    ADD_ALERTS,
    EDIT_ALERTS,
    DELETE_ALERTS,
}

export const hasAdminPermission = (
    data: PermissionData,
    permission: AdministrativePermissions
) => {
    return (
        hasPermission(data, AdministrativePermissions.ADMIN) ||
        hasPermission(data, permission)
    );
};
