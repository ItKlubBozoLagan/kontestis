import type { ContestMemberWithInfo } from "@kontestis/models";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { VisibleProblem } from "@/api/problems";
import { RankBadge } from "@/components/badges/RankBadge";
import { ScoreBadge } from "@/components/badges/ScoreBadge";
import { DataTable } from "@/components/common/DataTable";

type Row = ContestMemberWithInfo & { total: number; place: number };

/** Compact standings of a contest for staff (per problem scores and total). */
export const StandingsTable = ({
    members,
    problems,
    useExamScores = false,
}: {
    members: ContestMemberWithInfo[];
    problems: VisibleProblem[];
    useExamScores?: boolean;
}) => {
    const { t } = useTranslation();

    const rows = useMemo<Row[]>(() => {
        const withTotals = members.map((member) => {
            const scores = useExamScores ? member.exam_score : member.score;

            return {
                ...member,
                total: problems.reduce(
                    (sum, problem) => sum + (scores[problem.id.toString()] ?? 0),
                    0
                ),
                place: 0,
            };
        });

        withTotals.sort((a, b) => b.total - a.total || a.full_name.localeCompare(b.full_name));

        let place = 0;

        return withTotals.map((row, index) => {
            if (index === 0 || withTotals[index - 1].total !== row.total) place = index + 1;

            return { ...row, place };
        });
    }, [members, problems, useExamScores]);

    const maxTotal = problems.reduce((sum, problem) => sum + problem.score, 0);

    const columns = useMemo<ColumnDef<Row>[]>(
        () => [
            {
                accessorKey: "place",
                header: t("management.overview.rank"),
                meta: { className: "w-12" },
            },
            {
                accessorKey: "full_name",
                header: t("management.overview.participant"),
                cell: ({ row }) => (
                    <span className="flex items-center gap-2 font-sans">
                        <RankBadge elo={row.original.elo} label={String(row.original.elo)} />
                        <span className="truncate">{row.original.full_name}</span>
                    </span>
                ),
            },
            ...problems.map(
                (problem): ColumnDef<Row> => ({
                    id: problem.id.toString(),
                    header: problem.title,
                    accessorFn: (row) =>
                        (useExamScores ? row.exam_score : row.score)[problem.id.toString()] ?? 0,
                    cell: ({ row }) => {
                        const score = (
                            useExamScores ? row.original.exam_score : row.original.score
                        )[problem.id.toString()];

                        return <ScoreBadge score={score} max={problem.score} dimWhenUnattempted />;
                    },
                })
            ),
            {
                accessorKey: "total",
                header: t("management.overview.total"),
                cell: ({ row }) => <ScoreBadge score={row.original.total} max={maxTotal} />,
            },
        ],
        [t, problems, useExamScores, maxTotal]
    );

    return (
        <DataTable
            columns={columns}
            data={rows}
            searchable
            pageSize={20}
            getRowId={(row) => row.id.toString()}
            empty={t("management.overview.noStandings")}
        />
    );
};
