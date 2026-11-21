import {
    AdminPermissions,
    hasAdminPermission,
    type Organisation,
    type OrganisationMember,
    OrganisationPermissions,
} from "@kontestis/models";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight, Building2, LogOut, Settings } from "lucide-react";
import { hasPermission } from "permissio";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";

import { useCurrentUser, useLogout } from "@/api/auth";
import { organisationQueries } from "@/api/organisations";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { JoinContestDialog } from "@/components/contest/JoinContestDialog";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateOrganisationDialog } from "@/features/organisations/CreateOrganisationDialog";
import { useOrganisationStore } from "@/stores/organisation";

const DEFAULT_ORGANISATION_ID = 1n;

/** Same rule as the legacy organisation table: who sees the "manage" shortcut. */
const canManage = (
    organisation: Organisation,
    userId: bigint,
    userPermissions: bigint,
    memberships: OrganisationMember[]
) =>
    organisation.id !== DEFAULT_ORGANISATION_ID &&
    (organisation.owner === userId ||
        hasAdminPermission(userPermissions, AdminPermissions.EDIT_ORGANISATIONS) ||
        memberships.some(
            (member) =>
                member.organisation_id === organisation.id &&
                (hasPermission(member.permissions, OrganisationPermissions.VIEW_USER) ||
                    hasPermission(member.permissions, OrganisationPermissions.ADMIN))
        ));

const OrganisationTable = ({
    organisations,
    onOpen,
    onManage,
    manageable,
}: {
    organisations: Organisation[];
    onOpen: (organisation: Organisation) => void;
    onManage: (organisation: Organisation) => void;
    manageable: (organisation: Organisation) => boolean;
}) => {
    const { t } = useTranslation();
    const user = useCurrentUser();

    const columns = useMemo<ColumnDef<Organisation>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("organisations.select.columns.name"),
                cell: ({ row: { original: organisation } }) => (
                    <div className="flex items-center gap-2">
                        <Building2 className="text-muted-foreground size-4" />
                        <span className="font-medium">{organisation.name}</span>
                        {organisation.id === DEFAULT_ORGANISATION_ID && (
                            <Badge variant="secondary" className="font-sans">
                                {t("organisations.select.default")}
                            </Badge>
                        )}
                        {organisation.owner === user.id &&
                            organisation.id !== DEFAULT_ORGANISATION_ID && (
                                <Badge variant="outline" className="font-sans">
                                    {t("organisations.manage.members.owner")}
                                </Badge>
                            )}
                    </div>
                ),
            },
            {
                id: "details",
                header: t("organisations.select.columns.details"),
                enableSorting: false,
                meta: { className: "w-0 text-right" },
                cell: ({ row: { original: organisation } }) => (
                    <div className="flex justify-end gap-1">
                        {manageable(organisation) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onManage(organisation)}
                            >
                                <Settings />
                                {t("organisations.select.manage")}
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => onOpen(organisation)}>
                            {t("organisations.select.open")}
                            <ArrowRight />
                        </Button>
                    </div>
                ),
            },
        ],
        [t, user.id, manageable, onManage, onOpen]
    );

    return (
        <DataTable
            columns={columns}
            data={organisations}
            mono={false}
            searchable={organisations.length > 8}
            pageSize={15}
            getRowId={(organisation) => organisation.id.toString()}
            onRowClick={onOpen}
        />
    );
};

export const OrganisationSelectPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const user = useCurrentUser();
    const logout = useLogout();
    const select = useOrganisationStore((state) => state.select);
    const { data: organisations } = useSuspenseQuery(organisationQueries.all());
    const { data: memberships } = useSuspenseQuery(organisationQueries.selfMemberships());

    const redirect = params.get("redirect");
    const sorted = useMemo(
        () => [...organisations].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
        [organisations]
    );
    const seesAll = hasAdminPermission(user.permissions, AdminPermissions.EDIT_ORGANISATIONS);
    const own = useMemo(
        () =>
            sorted.filter(
                (organisation) =>
                    organisation.id === DEFAULT_ORGANISATION_ID ||
                    memberships.some((member) => member.organisation_id === organisation.id)
            ),
        [sorted, memberships]
    );

    const open = (organisation: Organisation, to = redirect ?? "/") => {
        select(organisation.id);
        navigate(to, { replace: true });
    };

    const manageable = (organisation: Organisation) =>
        canManage(organisation, user.id, BigInt(user.permissions), memberships);

    // Sent here automatically (`?redirect=`) with a single choice: pick it, like the old
    // "skip organisation select" behaviour. Explicit visits from the switcher are left alone.
    const only = organisations.length === 1 ? organisations[0] : undefined;

    useEffect(() => {
        if (redirect !== null && only) open(only);
    }, [redirect, only]);

    const tableProps = {
        onOpen: (organisation: Organisation) => open(organisation),
        onManage: (organisation: Organisation) =>
            open(organisation, `/organisations/${organisation.id}`),
        manageable,
    };

    return (
        <div className="flex w-full flex-col gap-6">
            <div className="flex justify-end">
                <LanguageSwitcher />
            </div>
            <PageHeader
                title={t("organisations.select.title")}
                description={t("organisations.select.description")}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
                <JoinContestDialog variant="outline" />
                <CreateOrganisationDialog />
            </div>
            {seesAll ? (
                <>
                    <div className="flex flex-col gap-3">
                        <h2 className="text-lg font-medium">{t("organisations.select.yours")}</h2>
                        <OrganisationTable organisations={own} {...tableProps} />
                    </div>
                    <div className="flex flex-col gap-3">
                        <h2 className="text-lg font-medium">{t("organisations.select.all")}</h2>
                        <OrganisationTable organisations={sorted} {...tableProps} />
                    </div>
                </>
            ) : (
                <OrganisationTable organisations={sorted} {...tableProps} />
            )}
            <Button variant="ghost" className="self-end" onClick={logout}>
                <LogOut />
                {t("organisations.select.logout")}
            </Button>
        </div>
    );
};
