import { AdminPermissions, ContestMemberPermissions } from "@kontestis/models";
import { FC, useEffect, useState } from "react";
import { FiPlus } from "react-icons/all";
import { useParams } from "react-router";
import { Link } from "react-router-dom";

import { CanContestMember } from "../../../../components/CanContestMember";
import { SimpleButton } from "../../../../components/SimpleButton";
import {
    Table,
    TableHeadItem,
    TableHeadRow,
    TableItem,
    TableRow,
} from "../../../../components/Table";
import { Translated } from "../../../../components/Translated";
import { useContestContext } from "../../../../context/constestContext";
import { useAllClusters } from "../../../../hooks/problem/cluster/useAllClusters";
import { useProblem } from "../../../../hooks/problem/useProblem";
import { useGlobalProblemSubmissions } from "../../../../hooks/submission/useGlobalProblemSubmissions";
import { useTranslation } from "../../../../hooks/useTranslation";
import { signBigint } from "../../../../util/number";
import { SubmissionListTable } from "../../../submissions/SubmissionListTable";
import { CreateClusterModal } from "./clusters/CreateClusterModal";
import { ProblemInfoSection } from "./ProblemInfoSection";

type Properties = {
    problemId: string;
};

export const ContestProblemManagePage: FC = () => {
    const { problemId } = useParams<Properties>();
    const { data: problem } = useProblem(BigInt(problemId ?? 0));

    const { data: clusters } = useAllClusters(BigInt(problemId ?? 0));

    const [isReevaluating, setIsReevaluating] = useState(false);

    const { data: submissions } = useGlobalProblemSubmissions(BigInt(problemId ?? 0), {
        refetchInterval: isReevaluating ? 1000 : 10_000,
    });

    useEffect(() => {
        setIsReevaluating((submissions ?? []).some((s) => s.reevaluation));
    }, [submissions]);

    const { member } = useContestContext();

    const [modalOpen, setModalOpen] = useState(false);

    const { t } = useTranslation();

    return (
        <div tw={"w-full flex flex-col gap-6 items-end"}>
            <div tw={"w-3/5 self-center"}>
                {problem && <ProblemInfoSection problem={problem} />}
            </div>
            <div tw={"w-full flex gap-4 justify-end"}>
                <Link to="generators">
                    <SimpleButton>Manage Generators</SimpleButton>
                </Link>
                <CanContestMember
                    member={member}
                    permission={ContestMemberPermissions.EDIT}
                    adminPermission={AdminPermissions.EDIT_CONTEST}
                >
                    <SimpleButton prependIcon={FiPlus} onClick={() => setModalOpen(true)}>
                        {t("contests.management.individual.problems.cluster.createButton")}
                    </SimpleButton>
                </CanContestMember>
            </div>
            {problem && (
                <CreateClusterModal
                    isOpen={modalOpen}
                    onRequestClose={() => setModalOpen(false)}
                    onAfterClose={() => setModalOpen(false)}
                    problem={problem}
                />
            )}
            <Table tw={"w-full"}>
                <thead>
                    <TableHeadRow>
                        <TableHeadItem>
                            {t(
                                "contests.management.individual.problems.cluster.table.head.cluster"
                            )}
                        </TableHeadItem>
                        <TableHeadItem>
                            {t(
                                "contests.management.individual.problems.cluster.table.head.awardedScore"
                            )}
                        </TableHeadItem>
                    </TableHeadRow>
                </thead>
                <tbody>
                    {(clusters ?? [])
                        .sort((a, b) =>
                            signBigint(
                                a.order_number === b.order_number
                                    ? a.id - b.id
                                    : a.order_number - b.order_number
                            )
                        )
                        .map((cluster, id) => (
                            <TableRow key={cluster.id + ""}>
                                <TableItem>
                                    <Link
                                        to={cluster.id + ""}
                                        tw={"hover:(text-sky-800 cursor-pointer)"}
                                    >
                                        <Translated translationKey="contests.management.individual.problems.cluster.table.body.clusterIndex">
                                            {"#" + String(id + 1)}
                                        </Translated>
                                    </Link>
                                </TableItem>
                                <TableItem>{cluster.awarded_score}</TableItem>
                            </TableRow>
                        ))}
                </tbody>
            </Table>
            {problem && (
                <SubmissionListTable submissions={submissions} problem={problem} adminView={true} />
            )}
        </div>
    );
};
