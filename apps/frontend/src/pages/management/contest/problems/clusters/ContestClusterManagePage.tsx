import { FC, useState } from "react";
import { FiPlus } from "react-icons/all";
import { useParams } from "react-router";
import { Link } from "react-router-dom";

import { SimpleButton } from "../../../../../components/SimpleButton";
import {
    Table,
    TableHeadItem,
    TableHeadRow,
    TableItem,
    TableRow,
} from "../../../../../components/Table";
import { Translated } from "../../../../../components/Translated";
import { useAllTestcases } from "../../../../../hooks/problem/cluster/testcase/useAllTestcases";
import { useCluster } from "../../../../../hooks/problem/cluster/useCluster";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { ClusterInfoSection } from "./ClusterInfoSection";
import { CreateTestcaseModal } from "./testcases/CreateTestcaseModal";

type Properties = {
    problemId: string;
    clusterId: string;
};

export const ContestClusterManagePage: FC = () => {
    const { problemId, clusterId } = useParams<Properties>();

    const { data: cluster } = useCluster([BigInt(problemId ?? 0), BigInt(clusterId ?? 0)], {
        refetchInterval: (data) => (data?.status === "pending" ? 500 : 5000),
    });

    const { data: testcases } = useAllTestcases([BigInt(problemId ?? 0), BigInt(clusterId ?? 0)]);

    const [modalOpen, setModalOpen] = useState(false);

    const { t } = useTranslation();

    return (
        <div tw={"w-full flex flex-col gap-6 items-end"}>
            <div tw={"w-3/5 self-center"}>
                {" "}
                {cluster && <ClusterInfoSection cluster={cluster} />}
            </div>
            <div tw={"w-full flex flex-col gap-6 items-end"}>
                {cluster && (
                    <CreateTestcaseModal
                        isOpen={modalOpen}
                        onRequestClose={() => setModalOpen(false)}
                        onAfterClose={() => setModalOpen(false)}
                        cluster={cluster}
                    />
                )}
                {!cluster?.generator && (
                    <div tw={"w-full flex flex-col gap-6 items-end"}>
                        <SimpleButton prependIcon={FiPlus} onClick={() => setModalOpen(true)}>
                            {t(
                                "contests.management.individual.problems.cluster.testCase.createButton"
                            )}
                        </SimpleButton>
                        <Table tw={"w-full"}>
                            <thead>
                                <TableHeadRow>
                                    <TableHeadItem>
                                        {t(
                                            "contests.management.individual.problems.cluster.testCase.table.head.testCase"
                                        )}
                                    </TableHeadItem>
                                </TableHeadRow>
                            </thead>
                            <tbody>
                                {(testcases ?? [])
                                    .sort((a, b) => Number(a.id) - Number(b.id))
                                    .map((testcase, id) => (
                                        <TableRow key={testcase.id + ""}>
                                            <TableItem>
                                                <Link
                                                    to={testcase.id + ""}
                                                    tw={"hover:(text-sky-800 cursor-pointer)"}
                                                >
                                                    <Translated translationKey="contests.management.individual.problems.cluster.testCase.table.body.testCase">
                                                        {"#" + String(id + 1)}
                                                    </Translated>
                                                </Link>
                                            </TableItem>
                                        </TableRow>
                                    ))}
                            </tbody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
};
