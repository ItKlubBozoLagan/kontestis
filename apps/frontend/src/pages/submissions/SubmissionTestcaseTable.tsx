import { FC } from "react";
import { FiChevronsLeft } from "react-icons/all";
import tw from "twin.macro";

import { Table, TableHeadItem, TableHeadRow, TableItem, TableRow } from "../../components/Table";
import { useSubmissionTestcases } from "../../hooks/submission/useSubmissionTestcases";

type Properties = {
    cluster_submission_id: bigint;
    back: () => void;
};

export const SubmissionTestcaseTable: FC<Properties> = ({ cluster_submission_id, back }) => {
    const { data: testcaseSubmissions } = useSubmissionTestcases(cluster_submission_id);

    return (
        <Table tw={"w-full"}>
            <TableHeadRow>
                <TableHeadItem>
                    <div tw={"flex gap-2 items-center ml-[-0.5rem]"}>
                        <FiChevronsLeft
                            onClick={back}
                            tw={"hover:(text-sky-800 cursor-pointer) text-xl"}
                        />
                        <span>Testcase</span>
                    </div>
                </TableHeadItem>
                <TableHeadItem>Verdict</TableHeadItem>
                <TableHeadItem>Time</TableHeadItem>
                <TableHeadItem>Memory</TableHeadItem>
            </TableHeadRow>
            {testcaseSubmissions
                ?.sort((a, b) => Number(BigInt(a.testcase_id) - BigInt(b.testcase_id)))
                .map((ts, index) => (
                    <TableRow key={ts.id.toString()}>
                        <TableItem>Testcase #{index + 1}</TableItem>
                        <TableItem
                            css={ts.verdict === "accepted" ? tw`text-green-600` : tw`text-red-600`}
                        >
                            {ts.verdict}
                        </TableItem>
                        <TableItem>{ts.time_used_millis} ms</TableItem>
                        <TableItem>{ts.memory_used_megabytes} MiB</TableItem>
                        <TableItem>{ts.awarded_score} points</TableItem>
                    </TableRow>
                ))}
        </Table>
    );
};
