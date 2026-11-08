import type { Generator } from "@kontestis/models";
import { useSuspenseQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

import { problemQueries, useCreateGenerator, useDeleteGenerator } from "@/api/problems";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable } from "@/components/common/DataTable";
import { Section } from "@/components/common/Section";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { GeneratorForm } from "@/features/management/generators/GeneratorForm";
import {
    AuthoringBreadcrumb,
    problemPath,
} from "@/features/management/problems/AuthoringBreadcrumb";
import { useManagedContest } from "@/features/management/useManagedContest";
import { useContestAccess } from "@/hooks/useContestAccess";

const CreateGeneratorDialog = ({ problemId }: { problemId: bigint }) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const create = useCreateGenerator(problemId);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus />
                    {t("managementProblems.generators.create")}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{t("managementProblems.generators.dialog.title")}</DialogTitle>
                </DialogHeader>
                <GeneratorForm
                    submitLabel={t("managementProblems.generators.dialog.create")}
                    onSubmit={(values) =>
                        create.mutateAsync(values).then(() => {
                            toast.success(t("managementProblems.generators.dialog.created"));
                            setOpen(false);
                        })
                    }
                />
            </DialogContent>
        </Dialog>
    );
};

export const GeneratorsPage = () => {
    const { t } = useTranslation();
    const contest = useManagedContest();
    const { canEdit } = useContestAccess(contest);
    const { problemId = "0" } = useParams<{ problemId: string }>();
    const { data: problem } = useSuspenseQuery(problemQueries.detail(problemId));
    const { data: generators } = useSuspenseQuery(problemQueries.generators(problemId));
    const remove = useDeleteGenerator(problem.id);
    const base = `${problemPath(contest.id, problem.id)}/generators`;

    const columns = useMemo<ColumnDef<Generator>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("managementProblems.generators.columns.name"),
                cell: ({ row }) => (
                    <Link
                        to={`${base}/${row.original.id}`}
                        className="hover:text-primary flex items-center gap-2 font-medium"
                    >
                        <Wand2 className="text-muted-foreground size-4" />
                        {row.original.name}
                    </Link>
                ),
            },
            {
                accessorKey: "language",
                header: t("managementProblems.generators.columns.language"),
                cell: ({ row }) => t(`programmingLanguages.${row.original.language}`),
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
                                  description={t("managementProblems.generators.deleteDescription")}
                                  confirmLabel={t("common.delete")}
                                  onConfirm={() =>
                                      remove
                                          .mutateAsync(row.original.id)
                                          .then(() =>
                                              toast.success(
                                                  t("managementProblems.generators.deleted")
                                              )
                                          )
                                  }
                              />
                          ),
                      } satisfies ColumnDef<Generator>,
                  ]
                : []),
        ],
        [t, canEdit, remove, base]
    );

    return (
        <div className="flex w-full flex-col gap-5">
            <AuthoringBreadcrumb
                contestId={contest.id}
                items={[
                    { label: problem.title, to: problemPath(contest.id, problem.id) },
                    { label: t("managementProblems.breadcrumb.generators") },
                ]}
            />
            <Section
                title={t("managementProblems.generators.title")}
                icon={Wand2}
                actions={canEdit && <CreateGeneratorDialog problemId={problem.id} />}
                contentClassName="flex flex-col gap-3"
            >
                <p className="text-muted-foreground text-sm">
                    {t("managementProblems.generators.description")}
                </p>
                <DataTable
                    columns={columns}
                    data={generators}
                    getRowId={(row) => row.id.toString()}
                    rowHref={(row) => `${base}/${row.id}`}
                    empty={t("managementProblems.generators.empty")}
                />
            </Section>
        </div>
    );
};
