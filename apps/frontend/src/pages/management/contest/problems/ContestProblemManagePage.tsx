import { FC, useState } from "react";
import { FiPlus } from "react-icons/all";
import { useParams } from "react-router";
import { Link } from "react-router-dom";

import { SimpleButton } from "../../../../components/SimpleButton";
import {
    Table,
    TableHeadItem,
    TableHeadRow,
    TableItem,
    TableRow,
} from "../../../../components/Table";
import { useAllClusters } from "../../../../hooks/problem/cluster/useAllClusters";
import { useProblem } from "../../../../hooks/problem/useProblem";
import { CreateClusterModal } from "./clusters/CreateClusterModal";
import { ProblemInfoSection } from "./ProblemInfoSection";

type Properties = {
    problemId: string;
};

export const ContestProblemManagePage: FC = () => {
    const { problemId } = useParams<Properties>();
    const { data: problem } = useProblem(BigInt(problemId ?? 0));

    const { data: clusters } = useAllClusters(BigInt(problemId ?? 0));

    const [modalOpen, setModalOpen] = useState(false);

    return (
        <div tw={"w-full flex flex-col gap-6 items-end"}>
            <div tw={"w-3/5 self-center"}>
                {problem && <ProblemInfoSection problem={problem} />}
            </div>
            {problem && (
                <CreateClusterModal
                    isOpen={modalOpen}
                    onRequestClose={() => setModalOpen(false)}
                    onAfterClose={() => setModalOpen(false)}
                    problem={problem}
                />
            )}
            <SimpleButton prependIcon={FiPlus} onClick={() => setModalOpen(true)}>
                Create cluster
            </SimpleButton>
            <Table tw={"w-full"}>
                <thead>
                    <TableHeadRow>
                        <TableHeadItem>Cluster</TableHeadItem>
                        <TableHeadItem>Awarded Score</TableHeadItem>
                    </TableHeadRow>
                </thead>
                <tbody>
                    {(clusters ?? [])
                        .sort((a, b) => Number(a.id) - Number(b.id))
                        .map((cluster, id) => (
                            <TableRow key={cluster.id + ""}>
                                <TableItem>
                                    <Link
                                        to={cluster.id + ""}
                                        tw={"hover:(text-sky-800 cursor-pointer)"}
                                    >
                                        Cluster #{id + 1}
                                    </Link>
                                </TableItem>
                                <TableItem>{cluster.awarded_score}</TableItem>
                            </TableRow>
                        ))}
                </tbody>
            </Table>
        </div>
    );
};
