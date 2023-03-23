import { hasPermission, PermissionData } from "permissio";

export enum AdminPermissions {
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
    VIEW_ORGANISATIONS,
    EDIT_ORGANISATIONS,
    DELETE_ORGANISATIONS,
}

export const hasAdminPermission = (data: PermissionData, permission: AdminPermissions) => {
    return hasPermission(data, AdminPermissions.ADMIN) || hasPermission(data, permission);
};
