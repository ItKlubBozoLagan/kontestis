import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Check, Minus, RotateCcw, X } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "sonner";

import {
    type ProblemSubmissionListItem,
    submissionQueries,
    useReevaluateSubmission,
} from "@/api/submissions";
import { ScoreBadge } from "@/components/badges/ScoreBadge";
import { VerdictBadge } from "@/components/badges/VerdictBadge";
import { DataTable } from "@/components/common/DataTable";
import { Spinner } from "@/components/common/Spinner";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

const formatOptionalDate = (date: Date | undefined) => (date ? formatDate(date) : "–");

const SamplesCell = ({ passed }: { passed: boolean | null | undefined }) => {
    if (passed === undefined || passed === null)
        return <Minus className="text-muted-foreground size-4" />;

    return passed ? (
        <Check className="size-4 text-green-600" />
    ) : (
        <X className="size-4 text-red-600" />
    );
};

/** Every submission of a problem (staff view) with rejudge controls. */
export const ProblemSubmissionsTable = ({
    problemId,
    maxScore,
    canRejudge,
}: {
    problemId: bigint;
    maxScore: number;
    canRejudge: boolean;
}) => {
    const { t } = useTranslation();
    const { data, isPending } = useQuery({
        ...submissionQueries.allForProblem(problemId),
        refetchInterval: (query) =>
            query.state.data?.some((it) => it.reevaluation) ? 1000 : 10_000,
    });
    const reevaluate = useReevaluateSubmission();

    const columns = useMemo<ColumnDef<ProblemSubmissionListItem>[]>(
        () => [
            {
                accessorKey: "full_name",
                header: t("managementProblems.submissions.columns.user"),
                cell: ({ row }) => <span className="font-sans">{row.original.full_name}</span>,
            },
            {
                accessorKey: "verdict",
                header: t("managementProblems.submissions.columns.verdict"),
                cell: ({ row }) => (
                    <Link to={`/submission/${row.original.id}`}>
                        <VerdictBadge
                            verdict={row.original.reevaluation ? "pending" : row.original.verdict}
                        />
                    </Link>
                ),
            },
            {
                accessorKey: "time_used_millis",
                header: t("managementProblems.submissions.columns.time"),
                cell: ({ row }) => `${row.original.time_used_millis} ms`,
            },
            {
                accessorKey: "memory_used_megabytes",
                header: t("managementProblems.submissions.columns.memory"),
                cell: ({ row }) => `${row.original.memory_used_megabytes} MiB`,
            },
            {
                accessorKey: "language",
                header: t("managementProblems.submissions.columns.language"),
                cell: ({ row }) => t(`programmingLanguages.${row.original.language}`),
            },
            {
                accessorKey: "awarded_score",
                header: t("managementProblems.submissions.columns.points"),
                cell: ({ row }) => <ScoreBadge score={row.original.awarded_score} max={maxScore} />,
            },
            {
                id: "samples",
                header: t("managementProblems.submissions.columns.samples"),
                enableSorting: false,
                cell: ({ row }) => <SamplesCell passed={row.original.samples_passed} />,
            },
            {
                id: "created",
                accessorFn: (row) => row.id,
                // snowflakes are ordered by creation time
                sortingFn: (a, b) =>
                    a.original.id === b.original.id ? 0 : a.original.id > b.original.id ? 1 : -1,
                header: t("managementProblems.submissions.columns.submitted"),
                cell: ({ row }) => formatOptionalDate(row.original.created_at),
            },
            ...(canRejudge
                ? [
                      {
                          id: "rejudge",
                          header: "",
                          enableSorting: false,
                          meta: { className: "w-28 text-right" },
                          cell: ({ row }) => (
                              <Button
                                  variant="outline"
                                  size="xs"
                                  disabled={row.original.reevaluation}
                                  onClick={() =>
                                      reevaluate.mutate(row.original.id, {
                                          onSuccess: () =>
                                              toast.success(
                                                  t("managementProblems.submissions.rejudgeStarted")
                                              ),
                                      })
                                  }
                              >
                                  {row.original.reevaluation ? (
                                      <Spinner className="size-3" />
                                  ) : (
                                      <RotateCcw />
                                  )}
                                  {t("managementProblems.submissions.rejudge")}
                              </Button>
                          ),
                      } satisfies ColumnDef<ProblemSubmissionListItem>,
                  ]
                : []),
        ],
        [t, maxScore, canRejudge, reevaluate]
    );

    if (isPending) return <Spinner className="mx-auto my-8" />;

    return (
        <DataTable
            columns={columns}
            data={data ?? []}
            searchable
            pageSize={20}
            getRowId={(row) => row.id.toString()}
            initialSorting={[{ id: "created", desc: true }]}
            rowHref={(row) => `/submission/${row.id}`}
            empty={t("managementProblems.submissions.empty")}
        />
    );
};
