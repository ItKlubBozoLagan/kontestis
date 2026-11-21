import { useQueries, useSuspenseQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { FileCode2, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import {
    problemQueries,
    useCreateProblem,
    useDeleteProblem,
    type VisibleProblem,
} from "@/api/problems";
import { submissionQueries } from "@/api/submissions";
import { ScoreBadge } from "@/components/badges/ScoreBadge";
import { TagBadge } from "@/components/badges/TagBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable } from "@/components/common/DataTable";
import { Section } from "@/components/common/Section";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { emptyProblem, ProblemForm } from "@/features/management/problems/ProblemForm";
import { useManagedContest } from "@/features/management/useManagedContest";
import { useContestAccess } from "@/hooks/useContestAccess";

type Row = VisibleProblem & { users?: number; accepted?: number; total?: number };

const CreateProblemDialog = ({
    contestId,
    contestName,
}: {
    contestId: bigint;
    contestName: string;
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const create = useCreateProblem(contestId);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus />
                    {t("managementProblems.list.create")}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{t("managementProblems.form.createTitle")}</DialogTitle>
                    <DialogDescription>
                        {t("managementProblems.form.createDescription", { contest: contestName })}
                    </DialogDescription>
                </DialogHeader>
                <ProblemForm
                    defaultValues={emptyProblem()}
                    submitLabel={t("managementProblems.form.create")}
                    onSubmit={(values) =>
                        create.mutateAsync(values).then((problem) => {
                            toast.success(t("managementProblems.form.created"));
                            setOpen(false);
                            navigate(`/management/${contestId}/problems/${problem.id}`);
                        })
                    }
                />
            </DialogContent>
        </Dialog>
    );
};

export const ContestProblemsPage = () => {
    const { t } = useTranslation();
    const contest = useManagedContest();
    const { canEdit } = useContestAccess(contest);
    const { data: problems } = useSuspenseQuery(problemQueries.byContest(contest.id));
    const deleteProblem = useDeleteProblem();

    const submissionStats = useQueries({
        queries: problems.map((problem) => submissionQueries.allForProblem(problem.id)),
    });

    const rows = useMemo<Row[]>(
        () =>
            problems.map((problem, index) => {
                const submissions = submissionStats[index]?.data;

                return {
                    ...problem,
                    users: submissions
                        ? new Set(submissions.map((it) => it.user_id.toString())).size
                        : undefined,
                    accepted: submissions?.filter((it) => it.verdict === "accepted").length,
                    total: submissions?.length,
                };
            }),
        [problems, submissionStats]
    );

    const columns = useMemo<ColumnDef<Row>[]>(
        () => [
            {
                accessorKey: "title",
                header: t("managementProblems.list.columns.name"),
                cell: ({ row }) => (
                    <Link
                        to={`/management/${contest.id}/problems/${row.original.id}`}
                        className="hover:text-primary flex items-center gap-2 font-medium"
                    >
                        <FileCode2 className="text-muted-foreground size-4" />
                        {row.original.title}
                    </Link>
                ),
            },
            {
                accessorKey: "score",
                header: t("managementProblems.list.columns.score"),
                cell: ({ row }) => <span className="tabular-nums">{row.original.score}</span>,
            },
            {
                id: "variant",
                accessorFn: (row) => row.evaluation_variant,
                header: t("managementProblems.list.columns.variant"),
                cell: ({ row }) => t(`evaluationVariants.${row.original.evaluation_variant}`),
            },
            {
                id: "limits",
                header: t("managementProblems.list.columns.limits"),
                enableSorting: false,
                cell: ({ row }) => (
                    <span className="text-muted-foreground whitespace-nowrap">
                        {row.original.time_limit_millis} ms · {row.original.memory_limit_megabytes}{" "}
                        MiB
                    </span>
                ),
            },
            {
                id: "users",
                accessorFn: (row) => row.users ?? -1,
                header: t("managementProblems.list.columns.users"),
                cell: ({ row }) => row.original.users ?? "…",
            },
            {
                id: "solves",
                accessorFn: (row) => row.accepted ?? -1,
                header: t("managementProblems.list.columns.solves"),
                cell: ({ row }) =>
                    row.original.total === undefined ? (
                        "…"
                    ) : (
                        <ScoreBadge score={row.original.accepted ?? 0} max={row.original.total} />
                    ),
            },
            {
                id: "tags",
                header: t("managementProblems.list.columns.tags"),
                enableSorting: false,
                cell: ({ row }) => (
                    <div className="flex flex-wrap gap-1 font-sans">
                        {[...row.original.tags].sort().map((tag) => (
                            <TagBadge key={tag} tag={tag} />
                        ))}
                    </div>
                ),
            },
            ...(canEdit
                ? [
                      {
                          id: "actions",
                          header: "",
                          enableSorting: false,
                          meta: { className: "w-12 text-right" },
                          cell: ({ row }) => (
                              <ConfirmDialog
                                  trigger={
                                      <Button
                                          variant="ghost"
                                          size="icon-sm"
                                          aria-label={t("common.delete")}
                                      >
                                          <Trash2 className="text-destructive" />
                                      </Button>
                                  }
                                  description={t("managementProblems.list.deleteDescription", {
                                      title: row.original.title,
                                  })}
                                  confirmLabel={t("common.delete")}
                                  onConfirm={() =>
                                      deleteProblem
                                          .mutateAsync(row.original.id)
                                          .then(() =>
                                              toast.success(t("managementProblems.list.deleted"))
                                          )
                                  }
                              />
                          ),
                      } satisfies ColumnDef<Row>,
                  ]
                : []),
        ],
        [t, canEdit, deleteProblem, contest.id]
    );

    return (
        <Section
            title={t("managementProblems.list.title")}
            actions={
                canEdit && <CreateProblemDialog contestId={contest.id} contestName={contest.name} />
            }
            contentClassName="flex flex-col gap-3"
        >
            <p className="text-muted-foreground text-sm">
                {t("managementProblems.list.description")}
            </p>
            <DataTable
                columns={columns}
                data={rows}
                getRowId={(row) => row.id.toString()}
                rowHref={(row) => `/management/${contest.id}/problems/${row.id}`}
                empty={t("managementProblems.list.empty")}
            />
        </Section>
    );
};
