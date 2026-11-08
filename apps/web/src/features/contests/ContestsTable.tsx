import type { ContestWithPermissions } from "@kontestis/models";
import { cutText } from "@kontestis/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { Check, GraduationCap, Lock, Trophy, X } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { DataTable } from "@/components/common/DataTable";
import { ContestPhaseBadge } from "@/components/contest/ContestPhaseBadge";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RegisterButton } from "@/features/contests/RegisterButton";
import { useNow } from "@/hooks/useNow";
import { compareContests, contestEnd, contestPhase } from "@/lib/contest";
import { formatDateTime, formatDuration, formatSeconds } from "@/lib/format";

const Marker = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <span className="text-muted-foreground inline-flex">{children}</span>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
    </Tooltip>
);

const DurationCell = ({ contest }: { contest: ContestWithPermissions }) => {
    const now = useNow();

    return contestPhase(contest, now) === "running"
        ? formatDuration(contestEnd(contest) - now)
        : formatSeconds(contest.duration_seconds);
};

type Props = {
    contests: ContestWithPermissions[];
    searchable?: boolean;
    /** Hide the partaking column (temporary users are always registered). */
    hidePartaking?: boolean;
    empty?: React.ReactNode;
};

/** Contest list in the classic Kontestis table style, running contests first. */
export const ContestsTable = ({
    contests,
    searchable = false,
    hidePartaking = false,
    empty,
}: Props) => {
    const { t } = useTranslation();

    const sorted = useMemo(() => [...contests].sort((a, b) => compareContests(a, b)), [contests]);

    const columns = useMemo<ColumnDef<ContestWithPermissions>[]>(
        () => [
            {
                id: "name",
                accessorKey: "name",
                header: t("contests.table.name"),
                cell: ({ row: { original: contest } }) => (
                    <span className="flex items-center gap-2">
                        <span className="font-medium" title={contest.name}>
                            {cutText(contest.name, 40)}
                        </span>
                        {contest.official && (
                            <Marker label={t("contests.table.official")}>
                                <Trophy className="size-3.5 text-amber-500" />
                            </Marker>
                        )}
                        {contest.exam && (
                            <Marker label={t("contests.table.exam")}>
                                <GraduationCap className="size-3.5" />
                            </Marker>
                        )}
                        {!contest.public && (
                            <Marker label={t("contests.table.private")}>
                                <Lock className="size-3.5" />
                            </Marker>
                        )}
                        {contest.require_edu_verification && (
                            <Badge variant="outline" className="px-1 py-0 text-[10px]">
                                {t("contests.table.eduOnly")}
                            </Badge>
                        )}
                    </span>
                ),
            },
            {
                id: "start",
                accessorFn: (contest) => contest.start_time.getTime(),
                header: t("contests.table.startTime"),
                cell: ({ row: { original: contest } }) => formatDateTime(contest.start_time),
                meta: { className: "whitespace-nowrap" },
            },
            {
                id: "status",
                header: t("contests.table.status"),
                enableSorting: false,
                cell: ({ row: { original: contest } }) => <ContestPhaseBadge contest={contest} />,
            },
            {
                id: "duration",
                accessorKey: "duration_seconds",
                header: t("contests.table.duration"),
                cell: ({ row: { original: contest } }) => <DurationCell contest={contest} />,
                meta: { className: "whitespace-nowrap" },
            },
            ...(hidePartaking
                ? []
                : [
                      {
                          id: "partaking",
                          header: t("contests.table.partaking"),
                          enableSorting: false,
                          cell: ({ row: { original: contest } }) =>
                              contestPhase(contest) !== "finished" ? (
                                  contest.registered ? (
                                      <span className="text-green-700 dark:text-green-400">
                                          {t("contests.table.registered")}
                                      </span>
                                  ) : (
                                      <RegisterButton contest={contest} variant="link" />
                                  )
                              ) : contest.registered ? (
                                  <Check className="size-4 text-green-600" />
                              ) : (
                                  <X className="size-4 text-red-400" />
                              ),
                      } satisfies ColumnDef<ContestWithPermissions>,
                  ]),
        ],
        [t, hidePartaking]
    );

    return (
        <DataTable
            columns={columns}
            data={sorted}
            searchable={searchable}
            searchPlaceholder={t("contests.page.search")}
            rowHref={(contest) => `/contest/${contest.id}`}
            getRowId={(contest) => contest.id.toString()}
            empty={empty ?? t("contests.page.empty")}
            pageSize={25}
        />
    );
};
