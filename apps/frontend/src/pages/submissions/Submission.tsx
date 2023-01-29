import { FC, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useParams } from "react-router";
import tw from "twin.macro";

import {
    Table,
    TableHeadItem,
    TableHeadRow,
    TableItem,
    TableRow,
} from "../../components/Table";
import { TitledSection } from "../../components/TitledSection";
import { useSubmission } from "../../hooks/submission/useSubmission";
import { useSubmissionClusters } from "../../hooks/submission/useSubmissionClusters";
import { ClusterSubmissionType } from "../../types/ClusterSubmissionType";
import { SubmissionTestcaseTable } from "./SubmissionTestcaseTable";

type Properties = {
    submission_id: string;
};

export const Submission: FC = () => {
    const { submission_id } = useParams<Properties>();

    // TODO: maybe verify submission_id
    const { data: submission } = useSubmission(BigInt(submission_id ?? 0));
    const { data: submissionCluster } = useSubmissionClusters(
        BigInt(submission_id ?? 0)
    );

    const [selectedCluster, setSelectedCluster] =
        useState<ClusterSubmissionType>();
    const [displayTestcase, setDisplayTestcase] = useState(false);

    return (
        <div tw={"w-full h-full py-12 flex flex-col gap-5"}>
            <TitledSection title={"Code"}>
                <ReactMarkdown tw={"w-full"}>
                    {"```" +
                        (submission?.language ?? "py") +
                        atob(submission?.code ?? "") +
                        "```"}
                </ReactMarkdown>
            </TitledSection>
            {!displayTestcase ? (
                <Table tw={"w-full"}>
                    <TableHeadRow>
                        <TableHeadItem>Cluster</TableHeadItem>
                        <TableHeadItem>Verdict</TableHeadItem>
                        <TableHeadItem>Time</TableHeadItem>
                        <TableHeadItem>Memory</TableHeadItem>
                        <TableHeadItem>Score</TableHeadItem>
                    </TableHeadRow>
                    {submissionCluster
                        ?.sort((a, b) =>
                            Number(BigInt(a.cluster_id) - BigInt(b.cluster_id))
                        )
                        .map((c, index) => (
                            <TableRow key={c.id + ""}>
                                <TableItem
                                    tw={"hover:(text-sky-800 cursor-pointer)"}
                                    onClick={() => {
                                        setSelectedCluster(c);
                                        setDisplayTestcase(true);
                                    }}
                                >
                                    Cluster #{index + 1}:
                                </TableItem>
                                <TableItem
                                    css={
                                        c.verdict === "accepted"
                                            ? tw`text-green-600`
                                            : tw`text-red-600`
                                    }
                                >
                                    {c.verdict}
                                </TableItem>
                                <TableItem>{c.time_used_millis} ms</TableItem>
                                <TableItem>
                                    {c.memory_used_megabytes} MiB
                                </TableItem>
                                <TableItem>{c.awardedscore} points</TableItem>
                            </TableRow>
                        ))}
                </Table>
            ) : (
                <SubmissionTestcaseTable
                    cluster_submission_id={selectedCluster!.id}
                    back={() => setDisplayTestcase(false)}
                ></SubmissionTestcaseTable>
            )}
        </div>
    );
};
