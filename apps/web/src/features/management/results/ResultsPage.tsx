import type { ContestMemberWithInfo } from "@kontestis/models";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { FileDown, Info } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { contestQueries, downloadContestExport } from "@/api/contests";
import { managementQueries } from "@/api/extra-management";
import { problemQueries } from "@/api/problems";
import { ScoreBadge } from "@/components/badges/ScoreBadge";
import { Alert } from "@/components/common/Alert";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { GradingScaleSection } from "@/features/management/results/GradingScaleSection";
import {
    type ReviewState,
    reviewState,
    ReviewStatus,
} from "@/features/management/results/ReviewStatus";
import { gradeFor } from "@/features/management/shared/grading";
import { useManagedContest } from "@/features/management/useManagedContest";
import { useNow } from "@/hooks/useNow";
import { contestPhase } from "@/lib/contest";
import { formatPercent } from "@/lib/format";

type Row = ContestMemberWithInfo & {
    points: number;
    ratio: number;
    grade: string | undefined;
    review: ReviewState;
};

const ExportButton = ({ contestId, userId }: { contestId: bigint; userId: bigint }) => {
    const { t } = useTranslation();
    const [pending, setPending] = useState(false);

    return (
        <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => {
                setPending(true);
                downloadContestExport(contestId, userId).finally(() => setPending(false));
            }}
        >
            <FileDown />
            {t("management.results.exportDocx")}
        </Button>
    );
};

export const ResultsPage = () => {
    const { t } = useTranslation();
    const contest = useManagedContest();
    const now = useNow();
    const { data: members } = useSuspenseQuery(contestQueries.leaderboard(contest.id));
    const { data: problems } = useSuspenseQuery(problemQueries.byContest(contest.id));
    const { data: scales } = useSuspenseQuery(contestQueries.gradingScales(contest.id));
    const { data: finals } = useSuspenseQuery(
        managementQueries.contestFinalSubmissions(contest.id)
    );

    const maxScore = problems.reduce((sum, problem) => sum + problem.score, 0);

    const rows = useMemo<Row[]>(() => {
        const finalsByUser = new Map<string, typeof finals>();

        for (const final of finals) {
            const key = final.user_id.toString();

            finalsByUser.set(key, [...(finalsByUser.get(key) ?? []), final]);
        }

        return members
            .map((member) => {
                const points = Object.values(member.exam_score).reduce(
                    (sum, score) => sum + score,
                    0
                );

                return {
                    ...member,
                    points,
                    ratio: maxScore > 0 ? points / maxScore : 0,
                    grade: scales.length > 0 ? gradeFor(scales, points, maxScore) : undefined,
                    review: reviewState(finalsByUser.get(member.user_id.toString()) ?? []),
                };
            })
            .sort((a, b) => a.full_name.localeCompare(b.full_name));
    }, [members, finals, scales, maxScore]);

    const columns = useMemo<ColumnDef<Row>[]>(
        () => [
            {
                accessorKey: "full_name",
                header: t("management.results.table.user"),
                cell: ({ row }) => (
                    <span className="font-sans font-medium">{row.original.full_name}</span>
                ),
            },
            {
                accessorKey: "points",
                header: t("management.results.table.points"),
                cell: ({ row }) => <ScoreBadge score={row.original.points} max={maxScore} />,
            },
            {
                accessorKey: "ratio",
                header: t("management.results.table.percentage"),
                cell: ({ row }) => formatPercent(row.original.ratio, 1),
            },
            {
                id: "grade",
                accessorFn: (row) => row.grade ?? "",
                header: t("management.results.table.grade"),
                cell: ({ row }) => (
                    <span className="font-semibold">{row.original.grade ?? "–"}</span>
                ),
            },
            {
                accessorKey: "review",
                header: t("management.results.table.reviewed"),
                cell: ({ row }) => <ReviewStatus state={row.original.review} />,
            },
            {
                id: "export",
                header: t("management.results.table.export"),
                enableSorting: false,
                cell: ({ row }) => (
                    <ExportButton contestId={contest.id} userId={row.original.user_id} />
                ),
            },
        ],
        [t, maxScore, contest.id]
    );

    return (
        <div className="flex flex-col gap-6">
            {contestPhase(contest, now) !== "finished" && (
                <Alert variant="info" icon={Info}>
                    {t("management.results.notAvailable")}
                </Alert>
            )}
            <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
                <DataTable
                    columns={columns}
                    data={rows}
                    searchable
                    pageSize={50}
                    getRowId={(row) => row.id.toString()}
                    rowHref={(row) => `/management/${contest.id}/results/${row.user_id}`}
                    toolbar={
                        <span className="text-muted-foreground text-sm">
                            {t("management.results.maxPoints", { points: maxScore })}
                        </span>
                    }
                />
                <GradingScaleSection contestId={contest.id} scales={scales} />
            </div>
        </div>
    );
};
