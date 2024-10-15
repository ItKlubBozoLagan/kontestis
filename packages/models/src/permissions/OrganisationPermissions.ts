import { AdminPermissions } from "./AdminPermissions";

export enum OrganisationPermissions {
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
    VIEW,
}

export const OrganisationToAdminPermissionMap: Record<
    OrganisationPermissionKeys,
    AdminPermissions
> = {
    ADMIN: AdminPermissions.EDIT_ORGANISATIONS,
    VIEW_USER: AdminPermissions.VIEW_ORGANISATIONS,
    EDIT_USER: AdminPermissions.EDIT_ORGANISATIONS,
    DELETE_USER: AdminPermissions.EDIT_ORGANISATIONS,
    ADD_CONTEST: AdminPermissions.EDIT_ORGANISATIONS,
    VIEW_CONTEST: AdminPermissions.EDIT_ORGANISATIONS,
    EDIT_CONTEST: AdminPermissions.EDIT_ORGANISATIONS,
    DELETE_CONTEST: AdminPermissions.EDIT_ORGANISATIONS,
    ADD_ALERTS: AdminPermissions.EDIT_ORGANISATIONS,
    EDIT_ALERTS: AdminPermissions.EDIT_ORGANISATIONS,
    DELETE_ALERTS: AdminPermissions.EDIT_ORGANISATIONS,
    VIEW: AdminPermissions.VIEW_ORGANISATIONS,
};

export type OrganisationPermissionKeys = keyof typeof OrganisationPermissions;

export const OrganisationPermissionNames = ((values = Object.keys(OrganisationPermissions)) =>
    values.slice(values.length / 2))() as OrganisationPermissionKeys[];
