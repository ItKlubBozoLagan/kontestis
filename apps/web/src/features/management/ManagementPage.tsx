import {
    AdminPermissions,
    ContestMemberPermissions,
    type ContestWithPermissions,
    OrganisationPermissions,
} from "@kontestis/models";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Settings } from "lucide-react";
import { hasPermission } from "permissio";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { useCurrentUser } from "@/api/auth";
import { contestQueries, useCreateContest } from "@/api/contests";
import { useCurrentOrganisationMembership } from "@/api/organisations";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { ContestPhaseBadge } from "@/components/contest/ContestPhaseBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ContestForm } from "@/features/management/shared/ContestForm";
import { compareContests } from "@/lib/contest";
import { formatDateTime, formatSeconds } from "@/lib/format";
import { canInOrganisation, isAdmin } from "@/lib/permissions";
import { useOrganisationStore } from "@/stores/organisation";

const CreateContestDialog = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const user = useCurrentUser();
    const organisationId = useOrganisationStore((state) => state.organisationId);
    const { data: membership } = useCurrentOrganisationMembership();
    const [open, setOpen] = useState(false);
    const create = useCreateContest();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus />
                    {t("management.list.create")}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{t("management.contestForm.createTitle")}</DialogTitle>
                    <DialogDescription>
                        {t("management.contestForm.createDescription")}
                    </DialogDescription>
                </DialogHeader>
                <ContestForm
                    mode="create"
                    canSetExam={organisationId !== "1"}
                    canSetOfficial={canInOrganisation(
                        user,
                        membership?.permissions,
                        OrganisationPermissions.ADMIN
                    )}
                    pending={create.isPending}
                    onSubmit={(values) =>
                        create.mutate(values, {
                            onSuccess: (contest) => {
                                toast.success(t("management.contestForm.created"));
                                setOpen(false);
                                navigate(`/management/${contest.id}/overview`);
                            },
                        })
                    }
                />
            </DialogContent>
        </Dialog>
    );
};

export const ManagementPage = () => {
    const { t } = useTranslation();
    const user = useCurrentUser();
    const { data: contests } = useSuspenseQuery(contestQueries.all());

    const manageable = useMemo(
        () =>
            contests
                .filter(
                    (contest) =>
                        hasPermission(contest.permissions, ContestMemberPermissions.VIEW_PRIVATE) ||
                        hasPermission(contest.permissions, ContestMemberPermissions.ADMIN) ||
                        isAdmin(user, AdminPermissions.VIEW_CONTEST)
                )
                .sort((a, b) => compareContests(a, b)),
        [contests, user]
    );

    const columns = useMemo<ColumnDef<ContestWithPermissions>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("management.list.table.name"),
                cell: ({ row }) => (
                    <span className="flex items-center gap-2 font-medium">
                        <Settings className="text-muted-foreground size-4 shrink-0" />
                        <span className="truncate">{row.original.name}</span>
                    </span>
                ),
            },
            {
                id: "start",
                accessorFn: (contest) => contest.start_time.getTime(),
                header: t("management.list.table.startTime"),
                cell: ({ row }) => formatDateTime(row.original.start_time),
            },
            {
                id: "status",
                header: t("management.list.table.status"),
                enableSorting: false,
                cell: ({ row }) => <ContestPhaseBadge contest={row.original} />,
            },
            {
                accessorKey: "duration_seconds",
                header: t("management.list.table.duration"),
                cell: ({ row }) => formatSeconds(row.original.duration_seconds),
            },
            {
                id: "type",
                header: t("management.list.table.type"),
                enableSorting: false,
                cell: ({ row }) => (
                    <div className="flex flex-wrap gap-1 font-sans">
                        {row.original.exam && (
                            <Badge variant="secondary">{t("management.list.badges.exam")}</Badge>
                        )}
                        {row.original.official && (
                            <Badge>{t("management.list.badges.official")}</Badge>
                        )}
                        <Badge variant="outline">
                            {row.original.public
                                ? t("management.list.badges.public")
                                : t("management.list.badges.private")}
                        </Badge>
                    </div>
                ),
            },
        ],
        [t]
    );

    return (
        <>
            <PageHeader
                title={t("management.list.title")}
                description={t("management.list.description")}
                actions={<CreateContestDialog />}
            />
            <DataTable
                columns={columns}
                data={manageable}
                searchable
                pageSize={25}
                rowHref={(contest) => `/management/${contest.id}/overview`}
                empty={t("management.list.empty")}
            />
        </>
    );
};
