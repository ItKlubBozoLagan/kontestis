import {
    AdminPermissionNames,
    AdminPermissions,
    type AdminUserListItem,
    hasAdminPermission,
} from "@kontestis/models";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Search, ShieldCheck } from "lucide-react";
import { hasPermission } from "permissio";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useCurrentUser } from "@/api/auth";
import { userQueries, type UserSearchParams, useUpdateUserPermissions } from "@/api/users";
import { DataTable } from "@/components/common/DataTable";
import { PermissionsDialog } from "@/components/common/PermissionsDialog";
import { Section } from "@/components/common/Section";
import { UserAvatar } from "@/components/layout/UserMenu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 25;

const accountType = (user: AdminUserListItem) =>
    user.is_temporary ? "temporary" : user.is_edu ? "edu" : user.is_managed ? "managed" : "google";

const useDebounced = <T,>(value: T, delay = 300) => {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timeout = setTimeout(() => setDebounced(value), delay);

        return () => clearTimeout(timeout);
    }, [value, delay]);

    return debounced;
};

const PermissionsCell = ({ user }: { user: AdminUserListItem }) => {
    const { t } = useTranslation();
    const permissions = BigInt(user.permissions);

    if (hasPermission(permissions, AdminPermissions.ADMIN))
        return (
            <Badge variant="destructive" className="font-sans">
                <ShieldCheck />
                {t("admin.users.admin")}
            </Badge>
        );

    const granted = AdminPermissionNames.filter((name) =>
        hasPermission(permissions, AdminPermissions[name])
    );

    if (granted.length === 0) return <span className="text-muted-foreground">–</span>;

    return (
        <div className="flex max-w-56 flex-wrap gap-1">
            {granted.map((name) => (
                <Badge key={name} variant="secondary" className="font-sans">
                    {t(`permissions.names.${name}`)}
                </Badge>
            ))}
        </div>
    );
};

export const AdminUsersPage = () => {
    const { t } = useTranslation();
    const currentUser = useCurrentUser();
    const updatePermissions = useUpdateUserPermissions();
    const [searchInput, setSearchInput] = useState("");
    const search = useDebounced(searchInput.trim());
    const [sort, setSort] = useState<UserSearchParams["sort"]>("name");
    const [page, setPage] = useState(0);

    useEffect(() => setPage(0), [search, sort]);

    const { data, isPlaceholderData } = useQuery(
        userQueries.search({ search, page, pageSize: PAGE_SIZE, sort })
    );

    const canEdit = hasAdminPermission(currentUser.permissions, AdminPermissions.EDIT_USER);
    const pages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

    const columns = useMemo<ColumnDef<AdminUserListItem>[]>(
        () => [
            {
                id: "user",
                header: t("admin.users.columns.user"),
                cell: ({ row: { original: user } }) => (
                    <div className="flex min-w-0 items-center gap-3 font-sans">
                        <UserAvatar
                            name={user.full_name}
                            src={user.picture_url}
                            className="size-8"
                        />
                        <div className="flex min-w-0 flex-col">
                            <span className="flex items-center gap-2 truncate font-medium">
                                {user.full_name}
                                {user.id === currentUser.id && (
                                    <Badge variant="outline">{t("admin.users.you")}</Badge>
                                )}
                            </span>
                            <span className="text-muted-foreground truncate font-mono text-xs">
                                {user.email}
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                id: "type",
                header: t("admin.users.columns.type"),
                cell: ({ row }) => (
                    <Badge variant="outline" className="font-sans">
                        {t(`admin.users.types.${accountType(row.original)}`)}
                    </Badge>
                ),
            },
            {
                accessorKey: "organisation_count",
                header: t("admin.users.columns.organisations"),
                meta: { className: "text-right" },
            },
            {
                accessorKey: "submission_count",
                header: t("admin.users.columns.submissions"),
                meta: { className: "text-right" },
            },
            {
                id: "permissions",
                header: t("admin.users.columns.permissions"),
                cell: ({ row }) => <PermissionsCell user={row.original} />,
            },
            {
                id: "actions",
                header: "",
                meta: { className: "text-right" },
                cell: ({ row: { original: user } }) =>
                    canEdit && user.id !== currentUser.id ? (
                        <PermissionsDialog
                            trigger={
                                <Button variant="outline" size="sm" className="font-sans">
                                    {t("admin.users.editPermissions")}
                                </Button>
                            }
                            name={user.full_name}
                            names={AdminPermissionNames}
                            bits={AdminPermissions}
                            value={user.permissions}
                            canGrant={(bit) => hasAdminPermission(currentUser.permissions, bit)}
                            onSave={(permissions) =>
                                updatePermissions.mutateAsync(
                                    { userId: user.id, permissions },
                                    {
                                        onSuccess: () =>
                                            toast.success(t("admin.users.permissionsSaved")),
                                    }
                                )
                            }
                        />
                    ) : null,
            },
        ],
        [t, currentUser.id, currentUser.permissions, canEdit, updatePermissions]
    );

    return (
        <Section
            title={t("admin.users.title")}
            actions={
                data && (
                    <span className="text-muted-foreground text-sm">
                        {t("admin.users.description", { count: data.total })}
                    </span>
                )
            }
        >
            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="relative w-full max-w-sm">
                        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                        <Input
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder={t("admin.users.search")}
                            className="pl-8"
                        />
                    </div>
                    <Select
                        value={sort}
                        onValueChange={(value) => setSort(value as UserSearchParams["sort"])}
                    >
                        <SelectTrigger className="w-40" aria-label={t("admin.users.sort.label")}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="name">{t("admin.users.sort.name")}</SelectItem>
                            <SelectItem value="email">{t("admin.users.sort.email")}</SelectItem>
                            <SelectItem value="newest">{t("admin.users.sort.newest")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {!data ? (
                    <Skeleton className="h-96 w-full" />
                ) : (
                    <div
                        className={isPlaceholderData ? "opacity-60 transition-opacity" : undefined}
                    >
                        <DataTable
                            columns={columns}
                            data={data.items}
                            getRowId={(user) => user.id.toString()}
                        />
                    </div>
                )}
                <div className="text-muted-foreground flex items-center justify-end gap-2 text-sm">
                    <span>{t("common.page", { page: page + 1, pages })}</span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        disabled={page === 0}
                        onClick={() => setPage((current) => current - 1)}
                        aria-label={t("common.previous")}
                    >
                        <ChevronLeft />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        disabled={page + 1 >= pages}
                        onClick={() => setPage((current) => current + 1)}
                        aria-label={t("common.next")}
                    >
                        <ChevronRight />
                    </Button>
                </div>
            </div>
        </Section>
    );
};
