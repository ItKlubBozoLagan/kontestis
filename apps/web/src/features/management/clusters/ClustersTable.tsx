import type { Cluster } from "@kontestis/models";
import { useQueries, useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, Layers, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "sonner";

import { problemQueries, useDeleteCluster, useUpdateCluster } from "@/api/problems";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable } from "@/components/common/DataTable";
import { Spinner } from "@/components/common/Spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pollingClusters } from "@/features/management/clusters/clusterQueries";
import { GeneratorStateBadge } from "@/features/management/problems/GeneratorStateBadge";

type Row = Cluster & { index: number; testcases?: number };

export const ClustersTable = ({
    contestId,
    problemId,
    canEdit,
}: {
    contestId: bigint;
    problemId: bigint;
    canEdit: boolean;
}) => {
    const base = `/management/${contestId}/problems/${problemId}`;
    const { t } = useTranslation();
    const { data: clusters, isPending } = useQuery(pollingClusters(problemId));
    const update = useUpdateCluster(problemId);
    const remove = useDeleteCluster(problemId);

    const testcaseCounts = useQueries({
        queries: (clusters ?? []).map((cluster) => problemQueries.testcases(problemId, cluster.id)),
    });

    const rows = useMemo<Row[]>(
        () =>
            (clusters ?? []).map((cluster, index) => ({
                ...cluster,
                index,
                testcases: testcaseCounts[index]?.data?.length,
            })),
        [clusters, testcaseCounts]
    );

    /** Swaps two neighbours and normalises every order number to its position. */
    const move = async (index: number, direction: -1 | 1) => {
        const order = rows.map((row) => row.id);
        const target = index + direction;

        [order[index], order[target]] = [order[target], order[index]];

        await Promise.all(
            order.flatMap((id, position) => {
                const cluster = rows.find((row) => row.id === id)!;

                if (Number(cluster.order_number) === position) return [];

                return [
                    update.mutateAsync({
                        clusterId: id,
                        awarded_score: cluster.awarded_score,
                        is_sample: cluster.is_sample ?? false,
                        order_number: position,
                    }),
                ];
            })
        );
    };

    const columns = useMemo<ColumnDef<Row>[]>(
        () => [
            {
                id: "cluster",
                header: t("managementProblems.clusters.columns.cluster"),
                enableSorting: false,
                cell: ({ row }) => (
                    <Link
                        to={`${base}/${row.original.id}`}
                        className="hover:text-primary flex items-center gap-2 font-medium"
                    >
                        <Layers className="text-muted-foreground size-4" />
                        {t("managementProblems.clusters.name", { index: row.original.index + 1 })}
                        {row.original.is_sample && (
                            <Badge variant="secondary" className="font-sans">
                                {t("managementProblems.clusters.sample")}
                            </Badge>
                        )}
                    </Link>
                ),
            },
            {
                accessorKey: "awarded_score",
                header: t("managementProblems.clusters.columns.score"),
                enableSorting: false,
            },
            {
                id: "testcases",
                header: t("managementProblems.problem.testcases"),
                enableSorting: false,
                cell: ({ row }) => row.original.testcases ?? "…",
            },
            {
                id: "status",
                header: t("managementProblems.clusters.columns.status"),
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
                          meta: { className: "w-36 text-right" },
                          cell: ({ row }) => (
                              <div className="flex justify-end gap-1">
                                  <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      aria-label={t("managementProblems.clusters.moveUp")}
                                      disabled={row.original.index === 0 || update.isPending}
                                      onClick={() => move(row.original.index, -1)}
                                  >
                                      <ArrowUp />
                                  </Button>
                                  <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      aria-label={t("managementProblems.clusters.moveDown")}
                                      disabled={
                                          row.original.index === rows.length - 1 || update.isPending
                                      }
                                      onClick={() => move(row.original.index, 1)}
                                  >
                                      <ArrowDown />
                                  </Button>
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
                                      description={t(
                                          "managementProblems.clusters.deleteDescription"
                                      )}
                                      confirmLabel={t("common.delete")}
                                      onConfirm={() =>
                                          remove
                                              .mutateAsync(row.original.id)
                                              .then(() =>
                                                  toast.success(
                                                      t("managementProblems.clusters.deleted")
                                                  )
                                              )
                                      }
                                  />
                              </div>
                          ),
                      } satisfies ColumnDef<Row>,
                  ]
                : []),
        ],
        [t, canEdit, rows, update.isPending, base]
    );

    if (isPending) return <Spinner className="mx-auto my-8" />;

    return (
        <DataTable
            columns={columns}
            data={rows}
            getRowId={(row) => row.id.toString()}
            rowHref={(row) => `${base}/${row.id}`}
            empty={t("managementProblems.clusters.empty")}
        />
    );
};
