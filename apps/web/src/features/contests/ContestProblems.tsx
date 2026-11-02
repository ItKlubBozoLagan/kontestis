import type { Contest } from "@kontestis/models";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { FileText } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { problemQueries, type VisibleProblem } from "@/api/problems";
import { ScoreBadge } from "@/components/badges/ScoreBadge";
import { TagBadge } from "@/components/badges/TagBadge";
import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { contestPhase } from "@/lib/contest";

/** Problems sorted like before: by points, then title. */
export const sortProblems = <T extends { score: number; title: string }>(problems: T[]) =>
    [...problems].sort((a, b) => a.score - b.score || a.title.localeCompare(b.title));

export const useContestProblems = (contestId: bigint) => {
    const query = useQuery(problemQueries.byContest(contestId));
    const sorted = useMemo(() => sortProblems(query.data ?? []), [query.data]);

    return { ...query, problems: sorted };
};

export const ContestProblems = ({ contest }: { contest: Contest }) => {
    const { t } = useTranslation();
    const { problems, isPending } = useContestProblems(contest.id);
    const { data: scores } = useQuery(problemQueries.scores());

    const columns = useMemo<ColumnDef<VisibleProblem>[]>(
        () => [
            {
                id: "title",
                accessorKey: "title",
                header: contest.exam ? t("contests.view.examProblem") : t("contests.view.problem"),
                cell: ({ row: { original: problem } }) => (
                    <span className="flex items-center gap-2 font-medium">
                        <FileText className="text-muted-foreground size-4" />
                        {problem.title}
                    </span>
                ),
            },
            {
                id: "tags",
                header: t("contests.view.tags"),
                enableSorting: false,
                cell: ({ row: { original: problem } }) => (
                    <div className="flex flex-wrap gap-1">
                        {[...problem.tags].sort().map((tag) => (
                            <TagBadge key={tag} tag={tag} />
                        ))}
                    </div>
                ),
            },
            {
                id: "score",
                accessorKey: "score",
                header: t("contests.view.score"),
                cell: ({ row: { original: problem } }) => (
                    <ScoreBadge score={scores?.[problem.id.toString()] ?? 0} max={problem.score} />
                ),
                meta: { className: "w-32" },
            },
        ],
        [t, contest.exam, scores]
    );

    if (isPending) return <Skeleton className="h-40 w-full" />;

    if (problems.length === 0)
        return (
            <EmptyState
                title={
                    contestPhase(contest) === "upcoming"
                        ? t("contests.view.notStarted")
                        : t("contests.view.noProblems")
                }
            />
        );

    const total = problems.reduce((sum, problem) => sum + problem.score, 0);
    const mine = problems.reduce((sum, problem) => sum + (scores?.[problem.id.toString()] ?? 0), 0);

    return (
        <div className="flex flex-col gap-2">
            <DataTable
                columns={columns}
                data={problems}
                rowHref={(problem) => `/problem/${problem.id}`}
                getRowId={(problem) => problem.id.toString()}
            />
            <div className="text-muted-foreground flex items-center justify-end gap-2 text-sm">
                {t("contests.view.totalScore")}
                <ScoreBadge score={mine} max={total} />
            </div>
        </div>
    );
};
