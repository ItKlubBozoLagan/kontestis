import "/public/css/prism-custom.css";

import { ClusterSubmission } from "@kontestis/models";
import Prism from "prismjs";
import { FC, useEffect, useState } from "react";
import { FiCheck, FiCopy } from "react-icons/all";
import { useParams } from "react-router";
import tw from "twin.macro";

import { Table, TableHeadItem, TableHeadRow, TableItem, TableRow } from "../../components/Table";
import { TitledSection } from "../../components/TitledSection";
import { Translated } from "../../components/Translated";
import { useSubmission } from "../../hooks/submission/useSubmission";
import { useSubmissionClusters } from "../../hooks/submission/useSubmissionClusters";
import { useCopy } from "../../hooks/useCopy";
import { useTranslation } from "../../hooks/useTranslation";
import { convertFromBase64 } from "../../util/base";
import { SubmissionTestcaseTable } from "./SubmissionTestcaseTable";

Prism.manual = true;

type Properties = {
    submissionId: string;
};

export const SubmissionViewPage: FC = () => {
    const { submissionId } = useParams<Properties>();

    const { data: submission, isSuccess: isSubmissionSuccess } = useSubmission(
        BigInt(submissionId ?? 0)
    );
    const { data: submissionCluster } = useSubmissionClusters(BigInt(submissionId ?? 0));

    useEffect(() => {
        if (!isSubmissionSuccess) return;

        Prism.highlightAll();
    }, [isSubmissionSuccess, submission]);

    const [selectedCluster, setSelectedCluster] = useState<ClusterSubmission>();
    const [displayTestcase, setDisplayTestcase] = useState(false);

    const { t } = useTranslation();

    const { copy, copied } = useCopy();

    return (
        <div tw={"w-full h-full py-12 flex flex-col gap-5"}>
            <TitledSection title={"Code"}>
                {isSubmissionSuccess && (
                    <div tw={"relative w-full"}>
                        <pre>
                            <code
                                className={`line-numbers match-braces rainbow-braces language-${submission.language}`}
                            >
                                {convertFromBase64(submission.code)}
                            </code>
                        </pre>
                        <div tw={"absolute top-4 right-2 p-2"}>
                            {!copied ? (
                                <FiCopy
                                    tw={"cursor-pointer hover:opacity-75"}
                                    size={"24px"}
                                    onClick={() => copy(convertFromBase64(submission.code))}
                                />
                            ) : (
                                <div tw={"text-green-800 flex justify-center gap-2"}>
                                    <span>Copied</span>
                                    <FiCheck size={"20px"} />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </TitledSection>
            {isSubmissionSuccess && submission.verdict === "compilation_error" && (
                <TitledSection title={"Compile time error"}>
                    <div tw={"bg-neutral-100 px-4 w-full rounded overflow-auto"}>
                        <pre>{submission.error}</pre>
                    </div>
                </TitledSection>
            )}
            {!displayTestcase ? (
                <Table tw={"w-full"}>
                    <thead>
                        <TableHeadRow>
                            <TableHeadItem>{t("submissions.table.head.cluster")}</TableHeadItem>
                            <TableHeadItem>{t("submissions.table.head.verdict")}</TableHeadItem>
                            <TableHeadItem>{t("submissions.table.head.time")}</TableHeadItem>
                            <TableHeadItem>{t("submissions.table.head.memory")}</TableHeadItem>
                            <TableHeadItem>{t("submissions.table.head.points")}</TableHeadItem>
                        </TableHeadRow>
                    </thead>
                    <tbody>
                        {submissionCluster
                            ?.sort((a, b) => Number(BigInt(a.cluster_id) - BigInt(b.cluster_id)))
                            .map((submission, index) => (
                                <TableRow key={submission.id.toString()}>
                                    <TableItem
                                        tw={"hover:(text-sky-800 cursor-pointer)"}
                                        onClick={() => {
                                            setSelectedCluster(submission);
                                            setDisplayTestcase(true);
                                        }}
                                    >
                                        <Translated translationKey="submissions.table.body.clusterIndex">
                                            {String(index + 1)}
                                        </Translated>
                                    </TableItem>
                                    <TableItem
                                        css={
                                            submission.verdict === "accepted"
                                                ? tw`text-green-600`
                                                : tw`text-red-600`
                                        }
                                    >
                                        {submission.verdict}
                                    </TableItem>
                                    <TableItem>{submission.time_used_millis} ms</TableItem>
                                    <TableItem>{submission.memory_used_megabytes} MiB</TableItem>
                                    <TableItem>
                                        <Translated translationKey="submissions.table.body.pointsAchieved">
                                            {submission.awarded_score}
                                        </Translated>
                                    </TableItem>
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
