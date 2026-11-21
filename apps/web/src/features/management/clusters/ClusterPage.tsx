import { zodResolver } from "@hookform/resolvers/zod";
import type { Cluster, Testcase } from "@kontestis/models";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { FileText, Layers, RefreshCw, Settings2, Trash2, Wand2, XCircle } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

import {
    problemQueries,
    useClusterCache,
    useDeleteCluster,
    useDeleteTestcase,
    useUpdateCluster,
} from "@/api/problems";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable } from "@/components/common/DataTable";
import { Section } from "@/components/common/Section";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { pollingClusters } from "@/features/management/clusters/clusterQueries";
import { CreateTestcaseDialog } from "@/features/management/clusters/CreateTestcaseDialog";
import {
    AuthoringBreadcrumb,
    problemPath,
} from "@/features/management/problems/AuthoringBreadcrumb";
import {
    GenerationError,
    GeneratorStateBadge,
} from "@/features/management/problems/GeneratorStateBadge";
import { useManagedContest } from "@/features/management/useManagedContest";
import { useContestAccess } from "@/hooks/useContestAccess";

const settingsSchema = z.object({
    awarded_score: z.number().int().min(0).max(1_000_000),
    order_number: z.number().int().min(0),
    is_sample: z.boolean(),
});

type SettingsValues = z.infer<typeof settingsSchema>;

const ClusterSettings = ({ cluster, canEdit }: { cluster: Cluster; canEdit: boolean }) => {
    const { t } = useTranslation();
    const update = useUpdateCluster(cluster.problem_id);
    const form = useForm<SettingsValues>({
        resolver: zodResolver(settingsSchema),
        values: {
            awarded_score: cluster.awarded_score,
            order_number: Number(cluster.order_number),
            is_sample: cluster.is_sample ?? false,
        },
    });

    const submit = form.handleSubmit((values) =>
        update
            .mutateAsync({
                clusterId: cluster.id,
                ...values,
                awarded_score: values.is_sample ? 0 : values.awarded_score,
            })
            .then(() => toast.success(t("managementProblems.cluster.saved")))
    );

    const numberField = (name: "awarded_score" | "order_number", label: string) => (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                        <Input
                            type="number"
                            min={0}
                            disabled={
                                !canEdit || (name === "awarded_score" && form.watch("is_sample"))
                            }
                            {...field}
                            value={Number.isNaN(field.value) ? "" : field.value}
                            onChange={(event) => field.onChange(event.target.valueAsNumber)}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );

    return (
        <Form {...form}>
            <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                    {numberField("awarded_score", t("managementProblems.cluster.score"))}
                    {numberField("order_number", t("managementProblems.cluster.order"))}
                </div>
                <FormField
                    control={form.control}
                    name="is_sample"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start gap-2.5 rounded-md border p-3">
                            <FormControl>
                                <Checkbox
                                    disabled={!canEdit}
                                    checked={field.value}
                                    onCheckedChange={(value) => field.onChange(value === true)}
                                />
                            </FormControl>
                            <div className="flex flex-col gap-1">
                                <FormLabel>{t("managementProblems.cluster.sample")}</FormLabel>
                                <FormDescription>
                                    {t("managementProblems.clusters.dialog.sampleHint")}
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />
                {canEdit && (
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={!form.formState.isDirty || update.isPending}
                        >
                            {t("managementProblems.cluster.save")}
                        </Button>
                    </div>
                )}
            </form>
        </Form>
    );
};

const ClusterGeneration = ({ cluster, canEdit }: { cluster: Cluster; canEdit: boolean }) => {
    const { t } = useTranslation();
    const cache = useClusterCache(cluster.problem_id, cluster.id);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-sm">
                    {t("managementProblems.status.label")}
                </span>
                <GeneratorStateBadge state={cluster.status} />
            </div>
            {cluster.error && <GenerationError error={cluster.error} />}
            <p className="text-muted-foreground text-sm">
                {t("managementProblems.cluster.generationHint")}
            </p>
            {canEdit && (
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        variant="outline"
                        disabled={cache.isPending}
                        onClick={() =>
                            cache.mutate("drop", {
                                onSuccess: () =>
                                    toast.success(t("managementProblems.cluster.dropped")),
                            })
                        }
                    >
                        <XCircle />
                        {t("managementProblems.cluster.dropCache")}
                    </Button>
                    <Button
                        disabled={cache.isPending || cluster.status === "pending"}
                        onClick={() =>
                            cache.mutate("regenerate", {
                                onSuccess: () =>
                                    toast.success(t("managementProblems.cluster.regenerating")),
                            })
                        }
                    >
                        <RefreshCw
                            className={cluster.status === "pending" ? "animate-spin" : undefined}
                        />
                        {t("managementProblems.cluster.regenerate")}
                    </Button>
                </div>
            )}
        </div>
    );
};

type TestcaseRow = Testcase & { index: number };

export const ClusterPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const contest = useManagedContest();
    const { canEdit } = useContestAccess(contest);
    const { problemId = "0", clusterId = "0" } = useParams<{
        problemId: string;
        clusterId: string;
    }>();
    const { data: problem } = useSuspenseQuery(problemQueries.detail(problemId));
    const { data: cluster } = useSuspenseQuery({
        ...problemQueries.cluster(problemId, clusterId),
        refetchInterval: (query) => (query.state.data?.status === "pending" ? 1500 : 10_000),
    });
    const { data: testcases } = useSuspenseQuery({
        ...problemQueries.testcases(problemId, clusterId),
        refetchInterval: cluster.status === "pending" ? 2000 : false,
    });
    const { data: clusters = [] } = useQuery(pollingClusters(problemId));
    const { data: generators = [] } = useQuery(problemQueries.generators(problemId));
    const removeCluster = useDeleteCluster(problem.id);
    const removeTestcase = useDeleteTestcase(problem.id, cluster.id);

    const clusterIndex = Math.max(
        0,
        clusters.findIndex((it) => it.id === cluster.id)
    );
    const base = `${problemPath(contest.id, problem.id)}/${cluster.id}`;

    const rows = useMemo<TestcaseRow[]>(
        () =>
            [...testcases]
                .sort((a, b) => (a.id < b.id ? -1 : 1))
                .map((testcase, index) => ({ ...testcase, index })),
        [testcases]
    );

    const columns = useMemo<ColumnDef<TestcaseRow>[]>(
        () => [
            {
                id: "testcase",
                header: t("managementProblems.testcases.columns.testcase"),
                enableSorting: false,
                cell: ({ row }) => (
                    <Link
                        to={`${base}/${row.original.id}`}
                        className="hover:text-primary flex items-center gap-2 font-medium"
                    >
                        <FileText className="text-muted-foreground size-4" />
                        {t("managementProblems.testcases.name", { index: row.original.index + 1 })}
                    </Link>
                ),
            },
            {
                id: "input",
                header: t("managementProblems.testcases.columns.input"),
                enableSorting: false,
                cell: ({ row }) => t(`managementProblems.types.${row.original.input_type}`),
            },
            {
                id: "output",
                header: t("managementProblems.testcases.columns.output"),
                enableSorting: false,
                cell: ({ row }) =>
                    row.original.output_type === "auto"
                        ? t("managementProblems.types.auto")
                        : t("managementProblems.types.manual"),
            },
            {
                id: "generator",
                header: t("managementProblems.testcases.columns.generator"),
                enableSorting: false,
                cell: ({ row }) => {
                    if (row.original.input_type !== "generator")
                        return <span className="text-muted-foreground">–</span>;

                    const generator = generators.find((it) => it.id === row.original.generator_id);

                    return (
                        <span className="flex items-center gap-1.5">
                            <Wand2 className="text-muted-foreground size-3.5" />
                            {generator?.name ?? t("managementProblems.testcase.unknownGenerator")}
                            <span className="text-muted-foreground">
                                ({row.original.generator_input})
                            </span>
                        </span>
                    );
                },
            },
            {
                id: "status",
                header: t("managementProblems.testcases.columns.status"),
                enableSorting: false,
                cell: ({ row }) => (
                    <GeneratorStateBadge state={row.original.status} className="font-sans" />
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
                                  confirmLabel={t("common.delete")}
                                  onConfirm={() =>
                                      removeTestcase
                                          .mutateAsync(row.original.id)
                                          .then(() =>
                                              toast.success(
                                                  t("managementProblems.testcases.deleted")
                                              )
                                          )
                                  }
                              />
                          ),
                      } satisfies ColumnDef<TestcaseRow>,
                  ]
                : []),
        ],
        [t, base, generators, canEdit, removeTestcase]
    );

    return (
        <div className="flex w-full flex-col gap-5">
            <AuthoringBreadcrumb
                contestId={contest.id}
                items={[
                    { label: problem.title, to: problemPath(contest.id, problem.id) },
                    {
                        label: t("managementProblems.breadcrumb.cluster", {
                            index: clusterIndex + 1,
                        }),
                    },
                ]}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                    <Layers className="text-muted-foreground size-6" />
                    {t("managementProblems.clusters.name", { index: clusterIndex + 1 })}
                </h2>
                {canEdit && (
                    <ConfirmDialog
                        trigger={
                            <Button variant="outline" size="sm" className="text-destructive">
                                <Trash2 />
                                {t("managementProblems.cluster.delete")}
                            </Button>
                        }
                        description={t("managementProblems.clusters.deleteDescription")}
                        confirmLabel={t("common.delete")}
                        onConfirm={() =>
                            removeCluster.mutateAsync(cluster.id).then(() => {
                                toast.success(t("managementProblems.clusters.deleted"));
                                navigate(problemPath(contest.id, problem.id));
                            })
                        }
                    />
                )}
            </div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Section title={t("managementProblems.cluster.settings")} icon={Settings2}>
                    <ClusterSettings cluster={cluster} canEdit={canEdit} />
                </Section>
                <Section title={t("managementProblems.cluster.generation")} icon={RefreshCw}>
                    <ClusterGeneration cluster={cluster} canEdit={canEdit} />
                </Section>
            </div>
            <Section
                title={t("managementProblems.testcases.title")}
                icon={FileText}
                actions={
                    canEdit && (
                        <CreateTestcaseDialog
                            problemId={problem.id}
                            clusterId={cluster.id}
                            nextIndex={rows.length + 1}
                            basePath={base}
                        />
                    )
                }
            >
                <DataTable
                    columns={columns}
                    data={rows}
                    getRowId={(row) => row.id.toString()}
                    rowHref={(row) => `${base}/${row.id}`}
                    pageSize={50}
                    empty={t("managementProblems.testcases.empty")}
                />
            </Section>
        </div>
    );
};
