import "/public/css/prism-custom.css";

import { ClusterSubmission } from "@kontestis/models";
import Prism from "prismjs";
import { FC, useEffect, useState } from "react";
import { FiCopy } from "react-icons/all";
import { useParams } from "react-router";
import tw from "twin.macro";

import { Table, TableHeadItem, TableHeadRow, TableItem, TableRow } from "../../components/Table";
import { TitledSection } from "../../components/TitledSection";
import { useSubmission } from "../../hooks/submission/useSubmission";
import { useSubmissionClusters } from "../../hooks/submission/useSubmissionClusters";
import { SubmissionTestcaseTable } from "./SubmissionTestcaseTable";

Prism.manual = true;

type Properties = {
    submission_id: string;
};

export const Submission: FC = () => {
    const { submission_id } = useParams<Properties>();

    // TODO: maybe verify submission_id
    const { isSuccess: isSubmissionSuccess, data: submission } = useSubmission(
        BigInt(submission_id ?? 0)
    );
    const { data: submissionCluster } = useSubmissionClusters(BigInt(submission_id ?? 0));

    useEffect(() => {
        if (!isSubmissionSuccess) return;

        Prism.highlightAll();
    }, [isSubmissionSuccess, submission]);

    const [selectedCluster, setSelectedCluster] = useState<ClusterSubmission>();
    const [displayTestcase, setDisplayTestcase] = useState(false);

    return (
        <div tw={"w-full h-full py-12 flex flex-col gap-5"}>
            <TitledSection title={"Code"}>
                {isSubmissionSuccess && (
                    <div tw={"relative w-full"}>
                        <pre>
                            <code
                                className={`line-numbers match-braces rainbow-braces language-${submission.language}`}
                            >
                                {atob(submission.code)}
                            </code>
                        </pre>
                        <div tw={"absolute top-4 right-2 p-2 "}>
                            <FiCopy
                                tw={"cursor-pointer hover:opacity-75"}
                                size={"24px"}
                                onClick={() => navigator.clipboard.writeText(atob(submission.code))}
                            />
                        </div>
                    </div>
                )}
            </TitledSection>
            {!displayTestcase ? (
                <Table tw={"w-full"}>
                    <thead>
                        <TableHeadRow>
                            <TableHeadItem>Cluster</TableHeadItem>
                            <TableHeadItem>Verdict</TableHeadItem>
                            <TableHeadItem>Time</TableHeadItem>
                            <TableHeadItem>Memory</TableHeadItem>
                            <TableHeadItem>Score</TableHeadItem>
                        </TableHeadRow>
                    </thead>
                    <tbody>
                        {submissionCluster
                            ?.sort((a, b) => Number(BigInt(a.cluster_id) - BigInt(b.cluster_id)))
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
                                    <TableItem>{c.memory_used_megabytes} MiB</TableItem>
                                    <TableItem>{c.awarded_score} points</TableItem>
                                </TableRow>
                            ))}
                    </tbody>
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
