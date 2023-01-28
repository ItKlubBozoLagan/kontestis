import { hasPermission, PermissionData } from "permissio";

export enum AdministrativePermissions {
    ADMIN,
    VIEW_USER,
    EDIT_USER,
    VIEW_CONTEST,
    EDIT_CONTEST,
    CREATE_ALERTS,
    EDIT_ALERTS,
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
