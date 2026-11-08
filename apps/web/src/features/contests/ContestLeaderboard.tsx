import type { Contest, ContestMemberWithInfo } from "@kontestis/models";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { EyeOff, Medal } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useCurrentUser } from "@/api/auth";
import { contestQueries } from "@/api/contests";
import { RankBadge } from "@/components/badges/RankBadge";
import { ScoreBadge } from "@/components/badges/ScoreBadge";
import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useContestProblems } from "@/features/contests/ContestProblems";
import { useNow } from "@/hooks/useNow";
import { contestPhase } from "@/lib/contest";
import { cn } from "@/lib/utils";

type Row = ContestMemberWithInfo & { total: number; place: number };

const placeStyles = [
    "text-yellow-600 dark:text-yellow-400",
    "text-neutral-500 dark:text-neutral-300",
    "text-yellow-800 dark:text-amber-600",
];

/** Whether the leaderboard may be shown to this viewer (mirrors the backend rule). */
export const useLeaderboardVisibility = (contest: Contest, canViewPrivate: boolean) => {
    const phase = contestPhase(contest, useNow());

    if (phase === "upcoming") return canViewPrivate ? "visible" : "not-started";

    if (phase === "finished" || canViewPrivate || contest.show_leaderboard_during_contest)
        return "visible";

    return "hidden";
};

export const ContestLeaderboard = ({
    contest,
    canViewPrivate,
}: {
    contest: Contest;
    canViewPrivate: boolean;
}) => {
    const { t } = useTranslation();
    const user = useCurrentUser();
    const [showAll, setShowAll] = useState(false);
    const visibility = useLeaderboardVisibility(contest, canViewPrivate);
    const { problems } = useContestProblems(contest.id);
    const { data: members, isPending } = useQuery({
        ...contestQueries.leaderboard(contest.id, showAll && canViewPrivate),
        enabled: visibility === "visible",
        refetchInterval: contestPhase(contest) === "running" ? 30_000 : false,
    });

    const rows = useMemo<Row[]>(() => {
        const withTotals = (members ?? [])
            .map((member) => ({
                ...member,
                total: Object.values(member.score ?? {}).reduce((sum, score) => sum + score, 0),
                place: 0,
            }))
            .sort((a, b) => b.total - a.total);

        // equal totals share a place
        withTotals.forEach((row, index) => {
            row.place =
                index > 0 && withTotals[index - 1].total === row.total
                    ? withTotals[index - 1].place
                    : index + 1;
        });

        return withTotals;
    }, [members]);

    const maxTotal = problems.reduce((sum, problem) => sum + problem.score, 0);

    const columns = useMemo<ColumnDef<Row>[]>(
        () => [
            {
                id: "place",
                accessorKey: "place",
                header: t("contests.leaderboard.rank"),
                cell: ({ row: { original } }) => (
                    <span
                        className={cn(
                            "inline-flex items-center gap-1 font-semibold",
                            placeStyles[original.place - 1]
                        )}
                    >
                        {original.place <= 3 && original.total > 0 && (
                            <Medal className="size-3.5" />
                        )}
                        {original.place}
                    </span>
                ),
                meta: { className: "w-14" },
            },
            {
                id: "name",
                accessorKey: "full_name",
                header: t("contests.leaderboard.contestant"),
                cell: ({ row: { original } }) => (
                    <span className="flex items-center gap-2">
                        <span
                            className={cn(
                                original.user_id === user.id && "text-primary font-semibold"
                            )}
                        >
                            {original.full_name}
                        </span>
                        <RankBadge elo={original.elo} className="hidden sm:inline-flex" />
                        <span className="text-muted-foreground hidden text-xs md:inline">
                            @{original.edu_mail_domain ?? original.email_domain}
                        </span>
                    </span>
                ),
            },
            ...problems.map(
                (problem): ColumnDef<Row> => ({
                    id: `problem-${problem.id}`,
                    accessorFn: (row) => row.score?.[problem.id.toString()] ?? 0,
                    header: () => (
                        <span className="block max-w-28 truncate" title={problem.title}>
                            {problem.title}
                        </span>
                    ),
                    cell: ({ row: { original } }) => (
                        <ScoreBadge
                            score={original.score?.[problem.id.toString()] ?? 0}
                            max={problem.score}
                        />
                    ),
                })
            ),
            {
                id: "total",
                accessorKey: "total",
                header: t("contests.leaderboard.total"),
                cell: ({ row: { original } }) => (
                    <ScoreBadge score={original.total} max={maxTotal} />
                ),
            },
        ],
        [t, problems, maxTotal, user.id]
    );

    if (visibility === "not-started")
        return <EmptyState title={t("contests.leaderboard.notStarted")} />;

    if (visibility === "hidden")
        return <EmptyState icon={EyeOff} title={t("contests.leaderboard.disabled")} />;

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-normal">
                    {contestPhase(contest) === "finished"
                        ? t("contests.leaderboard.finished")
                        : t("contests.leaderboard.running")}
                </h3>
                {canViewPrivate && (
                    <Label className="text-muted-foreground flex items-center gap-2 font-normal">
                        <Switch checked={showAll} onCheckedChange={setShowAll} />
                        {t("contests.leaderboard.showAll")}
                    </Label>
                )}
            </div>
            {isPending ? (
                <Skeleton className="h-48 w-full" />
            ) : (
                <div className="overflow-x-auto">
                    <DataTable
                        columns={columns}
                        data={rows}
                        searchable={rows.length > 10}
                        pageSize={50}
                        getRowId={(row) => row.id.toString()}
                        rowClassName={(row) =>
                            row.original.user_id === user.id ? "bg-accent/70" : undefined
                        }
                        empty={t("contests.leaderboard.empty")}
                    />
                </div>
            )}
        </div>
    );
};
