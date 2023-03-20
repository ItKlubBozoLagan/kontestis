import { FC } from "react";
import { useParams } from "react-router";

import {
    Table,
    TableHeadItem,
    TableHeadRow,
    TableItem,
    TableRow,
} from "../../../../components/Table";
import { useAllClusters } from "../../../../hooks/problem/useAllClusters";
import { useProblem } from "../../../../hooks/problem/useProblem";
import { ProblemInfoSection } from "./ProblemInfoSection";

type Properties = {
    problemId: string;
};

export const ContestProblemManagePage: FC = () => {
    const { problemId } = useParams<Properties>();
    const { data: problem } = useProblem(BigInt(problemId ?? 0));

    const { data: clusters } = useAllClusters(BigInt(problemId ?? 0));

    return (
        <div tw={"w-full flex flex-col gap-6"}>
            <div tw={"w-3/5 self-center"}>
                {problem && <ProblemInfoSection problem={problem} />}
            </div>
            <Table tw={"w-full"}>
                <thead>
                    <TableHeadRow>
                        <TableHeadItem>Cluster</TableHeadItem>
                        <TableHeadItem>Awarded Score</TableHeadItem>
                    </TableHeadRow>
                </thead>
                <tbody>
                    {(clusters ?? [])
                        .sort((a, b) => Number(b.id) - Number(a.id))
                        .map((cluster, id) => (
                            <TableRow key={cluster.id + ""}>
                                <TableItem>Cluster #{id + 1}</TableItem>
                                <TableItem>{cluster.awarded_score}</TableItem>
                            </TableRow>
                        ))}
                </tbody>
            </Table>
        </div>
    );
};
