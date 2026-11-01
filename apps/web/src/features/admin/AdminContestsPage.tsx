import type { AdminContestListItem } from "@kontestis/models";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Settings } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { contestQueries } from "@/api/contests";
import { DataTable } from "@/components/common/DataTable";
import { Section } from "@/components/common/Section";
import { ContestPhaseBadge } from "@/components/contest/ContestPhaseBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { compareContests } from "@/lib/contest";
import { formatDateTime } from "@/lib/format";

const manageHref = (contest: AdminContestListItem) =>
    `/management/${contest.id}?organisationId=${contest.organisation_id}`;

export const AdminContestsPage = () => {
    const { t } = useTranslation();
    const { data } = useSuspenseQuery(contestQueries.adminAll());

    const contests = useMemo(() => [...data].sort((a, b) => compareContests(a, b)), [data]);

    const columns = useMemo<ColumnDef<AdminContestListItem>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("admin.contests.columns.name"),
                cell: ({ row: { original: contest } }) => (
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium">{contest.name}</span>
                        {contest.official && (
                            <Badge variant="secondary" className="font-sans">
                                {t("admin.contests.official")}
                            </Badge>
                        )}
                        {contest.exam && (
                            <Badge variant="outline" className="font-sans">
                                {t("admin.contests.exam")}
                            </Badge>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: "organisation_name",
                header: t("admin.contests.columns.organisation"),
                cell: ({ getValue }) => <span className="font-sans">{getValue<string>()}</span>,
            },
            {
                id: "start",
                accessorFn: (contest) => contest.start_time.getTime(),
                header: t("admin.contests.columns.start"),
                cell: ({ row }) => formatDateTime(row.original.start_time),
            },
            {
                id: "status",
                header: t("admin.contests.columns.status"),
                enableSorting: false,
                cell: ({ row }) => <ContestPhaseBadge contest={row.original} />,
            },
            {
                accessorKey: "member_count",
                header: t("admin.contests.columns.members"),
                meta: { className: "text-right" },
            },
            {
                accessorKey: "problem_count",
                header: t("admin.contests.columns.problems"),
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
                            {t("admin.contests.manage")}
                        </Link>
                    </Button>
                ),
            },
        ],
        [t]
    );

    return (
        <Section
            title={t("admin.contests.title")}
            actions={
                <span className="text-muted-foreground text-sm">
                    {t("admin.contests.description")}
                </span>
            }
        >
            <DataTable
                columns={columns}
                data={contests}
                searchable
                searchPlaceholder={t("admin.contests.search")}
                pageSize={20}
                getRowId={(contest) => contest.id.toString()}
                rowHref={manageHref}
            />
        </Section>
    );
};
