import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, FileDown } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";

import { contestQueries, downloadContestExport } from "@/api/contests";
import { problemQueries, type VisibleProblem } from "@/api/problems";
import { submissionQueries } from "@/api/submissions";
import { ScoreBadge } from "@/components/badges/ScoreBadge";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { ReviewStatus } from "@/features/management/results/ReviewStatus";
import { useManagedContest } from "@/features/management/useManagedContest";

type Row = VisibleProblem & {
    final?: { id: bigint; final_score: number; reviewed: boolean };
};

export const ParticipantResultsPage = () => {
    const { t } = useTranslation();
    const { userId = "0" } = useParams<{ userId: string }>();
    const contest = useManagedContest();
    const { data: problems } = useSuspenseQuery(problemQueries.byContest(contest.id));
    const { data: finals } = useSuspenseQuery(submissionQueries.finalForUser(contest.id, userId));
    const { data: members } = useQuery(contestQueries.leaderboard(contest.id, true));

    const member = members?.find((it) => it.user_id.toString() === userId);

    const rows = useMemo<Row[]>(
        () =>
            problems.map((problem) => ({
                ...problem,
                final: finals.find((final) => final.problem_id === problem.id),
            })),
        [problems, finals]
    );

    const total = rows.reduce((sum, row) => sum + (row.final?.final_score ?? 0), 0);
    const max = problems.reduce((sum, problem) => sum + problem.score, 0);

    const columns = useMemo<ColumnDef<Row>[]>(
        () => [
            {
                accessorKey: "title",
                header: t("management.results.participant.problem"),
                cell: ({ row }) => (
                    <span className="font-sans font-medium">{row.original.title}</span>
                ),
            },
            {
                id: "points",
                accessorFn: (row) => row.final?.final_score ?? 0,
                header: t("management.results.participant.points"),
                cell: ({ row }) => (
                    <ScoreBadge
                        score={row.original.final?.final_score ?? 0}
                        max={row.original.score}
                    />
                ),
            },
            {
                id: "status",
                header: t("management.results.participant.status"),
                enableSorting: false,
                cell: ({ row }) => (
                    <ReviewStatus
                        state={
                            !row.original.final
                                ? "none"
                                : row.original.final.reviewed
                                ? "reviewed"
                                : "pending"
                        }
                    />
                ),
            },
            {
                id: "open",
                header: "",
                enableSorting: false,
                cell: ({ row }) =>
                    row.original.final && (
                        <Button variant="outline" size="sm" asChild>
                            <Link to={`/review/${row.original.final.id}`}>
                                {t("management.results.participant.open")}
                            </Link>
                        </Button>
                    ),
            },
        ],
        [t]
    );

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <Button variant="ghost" size="sm" asChild className="w-fit">
                    <Link to={`/management/${contest.id}/results`}>
                        <ArrowLeft />
                        {t("management.results.participant.back")}
                    </Link>
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadContestExport(contest.id, userId)}
                >
                    <FileDown />
                    {t("management.results.exportDocx")}
                </Button>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-xl font-medium">
                    {t("management.results.participant.title")}
                    {member && <span className="text-muted-foreground"> · {member.full_name}</span>}
                </h2>
                <ScoreBadge score={total} max={max} className="text-lg" />
            </div>
            <DataTable
                columns={columns}
                data={rows}
                getRowId={(row) => row.id.toString()}
                rowHref={(row) => (row.final ? `/review/${row.final.id}` : undefined)}
            />
        </div>
    );
};
