import { FC } from "react";
import { FiChevronsLeft } from "react-icons/all";
import tw from "twin.macro";

import { Table, TableHeadItem, TableHeadRow, TableItem, TableRow } from "../../components/Table";
import { Translated } from "../../components/Translated";
import { useSubmissionTestcases } from "../../hooks/submission/useSubmissionTestcases";
import { useTranslation } from "../../hooks/useTranslation";

type Properties = {
    cluster_submission_id: bigint;
    back: () => void;
};

export const SubmissionTestcaseTable: FC<Properties> = ({ cluster_submission_id, back }) => {
    const { data: testcaseSubmissions } = useSubmissionTestcases(cluster_submission_id);

    const { t } = useTranslation();

    return (
        <Table tw={"w-full"}>
            <TableHeadRow>
                <TableHeadItem>
                    <div tw={"flex gap-2 items-center ml-[-0.5rem]"}>
                        <FiChevronsLeft
                            onClick={back}
                            tw={"hover:(text-sky-800 cursor-pointer) text-xl"}
                        />
                        <span>{t("submissions.table.head.testcase")}</span>
                    </div>
                </TableHeadItem>
                <TableHeadItem>{t("submissions.table.head.verdict")}</TableHeadItem>
                <TableHeadItem>{t("submissions.table.head.time")}</TableHeadItem>
                <TableHeadItem>{t("submissions.table.head.memory")}</TableHeadItem>
                <TableHeadItem>{t("submissions.table.head.points")}</TableHeadItem>
            </TableHeadRow>
            {testcaseSubmissions
                ?.sort((a, b) => Number(BigInt(a.testcase_id) - BigInt(b.testcase_id)))
                .map((ts, index) => (
                    <TableRow key={ts.id.toString()}>
                        <TableItem>
                            <Translated translationKey="submissions.table.body.testcaseIndex">
                                {String(index + 1) + ":"}
                            </Translated>
                        </TableItem>
                        <TableItem
                            css={ts.verdict === "accepted" ? tw`text-green-600` : tw`text-red-600`}
                        >
                            {ts.verdict}
                        </TableItem>
                        <TableItem>{ts.time_used_millis} ms</TableItem>
                        <TableItem>{ts.memory_used_megabytes} MiB</TableItem>
                        <TableItem>
                            <Translated translationKey="submissions.table.body.pointsAchieved">
                                {ts.awarded_score ?? "?"}
                            </Translated>
                        </TableItem>
                    </TableRow>
                ))}
        </Table>
    );
};
