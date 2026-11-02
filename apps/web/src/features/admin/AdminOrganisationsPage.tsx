import type { OrganisationOverview } from "@kontestis/models";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Settings } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { adminQueries } from "@/api/extra-admin";
import { DataTable } from "@/components/common/DataTable";
import { Section } from "@/components/common/Section";
import { Button } from "@/components/ui/button";

const manageHref = (organisation: OrganisationOverview) => `/organisations/${organisation.id}`;

export const AdminOrganisationsPage = () => {
    const { t } = useTranslation();
    const { data: organisations } = useSuspenseQuery(adminQueries.organisationOverview());

    const columns = useMemo<ColumnDef<OrganisationOverview>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("admin.organisations.columns.name"),
                cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
            },
            {
                accessorKey: "owner_name",
                header: t("admin.organisations.columns.owner"),
                cell: ({ getValue }) => (
                    <span className="font-sans">{getValue<string | null>() ?? "–"}</span>
                ),
            },
            {
                accessorKey: "member_count",
                header: t("admin.organisations.columns.members"),
                meta: { className: "text-right" },
            },
            {
                accessorKey: "contest_count",
                header: t("admin.organisations.columns.contests"),
                meta: { className: "text-right" },
            },
            {
                id: "actions",
                header: "",
                enableSorting: false,
                meta: { className: "text-right" },
                cell: ({ row }) => (
                    <Button variant="ghost" size="sm" className="font-sans" asChild>
                        <Link to={manageHref(row.original)}>
                            <Settings />
                            {t("admin.organisations.manage")}
                        </Link>
                    </Button>
                ),
            },
        ],
        [t]
    );

    return (
        <Section
            title={t("admin.organisations.title")}
            actions={
                <span className="text-muted-foreground text-sm">
                    {t("admin.organisations.description", { count: organisations.length })}
                </span>
            }
        >
            <DataTable
                columns={columns}
                data={organisations}
                searchable
                searchPlaceholder={t("admin.organisations.search")}
                pageSize={25}
                initialSorting={[{ id: "name", desc: false }]}
                getRowId={(organisation) => organisation.id.toString()}
                rowHref={manageHref}
            />
        </Section>
    );
};
