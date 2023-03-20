import { FC } from "react";
import { useParams } from "react-router";

import {
    Table,
    TableHeadItem,
    TableHeadRow,
    TableItem,
    TableRow,
} from "../../../../../components/Table";
import { useAllTestcases } from "../../../../../hooks/problem/cluster/testcase/useAllTestcases";
import { useCluster } from "../../../../../hooks/problem/cluster/useCluster";
import { ClusterInfoSection } from "./ClusterInfoSection";

type Properties = {
    problemId: string;
    clusterId: string;
};

export const ContestClusterManagePage: FC = () => {
    const { problemId, clusterId } = useParams<Properties>();

    const { data: cluster } = useCluster([BigInt(problemId ?? 0), BigInt(clusterId ?? 0)]);

    const { data: testcases } = useAllTestcases([BigInt(problemId ?? 0), BigInt(clusterId ?? 0)]);

    return (
        <div tw={"w-full flex flex-col gap-6"}>
            <div tw={"w-3/5 self-center"}>
                {" "}
                {cluster && <ClusterInfoSection cluster={cluster} />}
            </div>
            <Table tw={"w-full"}>
                <thead>
                    <TableHeadRow>
                        <TableHeadItem>Testcase</TableHeadItem>
                    </TableHeadRow>
                </thead>
                <tbody>
                    {(testcases ?? [])
                        .sort((a, b) => Number(a.id) - Number(b.id))
                        .map((testcase, id) => (
                            <TableRow key={testcase.id + ""}>
                                <TableItem>Testcase #{id + 1}</TableItem>
                            </TableRow>
                        ))}
                </tbody>
            </Table>
        </div>
    );
};
