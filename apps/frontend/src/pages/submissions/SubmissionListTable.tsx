import {
    ProblemWithScore,
    SubmissionByProblemResponse,
    SubmissionWithUserInfo,
} from "@kontestis/models";
import { FC, useState } from "react";
import { AiFillCaretDown, AiFillCaretUp } from "react-icons/all";

import { Table, TableHeadItem, TableHeadRow, TableItem, TableRow } from "../../components/Table";
import { useContest } from "../../hooks/contest/useContest";
import { useAllFinalSubmissions } from "../../hooks/submission/final/useAllFinalSubmissions";
import { useTranslation } from "../../hooks/useTranslation";
import { useAuthStore } from "../../state/auth";
import { SubmissionListItem } from "./SubmissionListItem";

type Properties = {
    submissions?: SubmissionByProblemResponse[] | SubmissionWithUserInfo[];
    problem: ProblemWithScore;
    adminView: boolean;
};

export const SubmissionListTable: FC<Properties> = ({
    submissions,
    problem,
    adminView = false,
}) => {
    const [expanded, setExpanded] = useState(false);

    const { user } = useAuthStore();

    const { data: contest } = useContest(problem?.contest_id ?? 0n, { enabled: !!problem });
    const { data: finalSubmissions } = useAllFinalSubmissions([contest?.id ?? 0n, user.id], {
        enabled: !!contest && contest.exam && !adminView,
    });

    const { t } = useTranslation();

    return (
        <Table tw={"w-full"}>
            <thead>
                <TableHeadRow>
                    {adminView && <TableHeadItem>{t("submissions.table.head.user")}</TableHeadItem>}
                    <TableHeadItem>{t("submissions.table.head.verdict")}</TableHeadItem>
                    <TableHeadItem>{t("submissions.table.head.time")}</TableHeadItem>
                    <TableHeadItem>{t("submissions.table.head.memory")}</TableHeadItem>
                    <TableHeadItem>{t("submissions.table.head.language")}</TableHeadItem>
                    <TableHeadItem>{t("submissions.table.head.points")}</TableHeadItem>
                    {!adminView && contest && contest.exam && (
                        <TableHeadItem>{t("submissions.table.head.final")}</TableHeadItem>
                    )}
                    {adminView && <TableHeadItem>Rejudge</TableHeadItem>}
                </TableHeadRow>
            </thead>
            <tbody>
                {!submissions && (
                    <TableRow>
                        <TableItem colSpan={100} tw={"text-center"}>
                            {t("submissions.loading")}
                        </TableItem>
                    </TableRow>
                )}
                {submissions?.length === 0 && (
                    <TableRow>
                        <TableItem colSpan={100} tw={"text-center"}>
                            {t("submissions.empty")}
                        </TableItem>
                    </TableRow>
                )}
                {submissions
                    ?.sort((a, b) => Number(BigInt(b.id) - BigInt(a.id)))
                    .slice(0, expanded || submissions.length <= 4 ? submissions.length : 3)
                    .map((submission) => (
                        <SubmissionListItem
                            submission={submission}
                            adminView={adminView}
                            problem={problem}
                            contest={contest}
                            finalSubmissions={finalSubmissions}
                            key={submission.id.toString()}
                        />
                    ))}
            </tbody>
            {submissions && submissions.length > 4 && (
                <tfoot>
                    <TableRow>
                        <TableItem
                            colSpan={100}
                            onClick={() => setExpanded((current) => !current)}
                            tw={"cursor-pointer"}
                        >
                            <div tw={"flex gap-2 items-center justify-center"}>
                                {expanded ? (
                                    <>
                                        <AiFillCaretUp />
                                        {t("submissions.table.overflow.collapse")}
                                    </>
                                ) : (
                                    <>
                                        <AiFillCaretDown />
                                        {t("submissions.table.overflow.expand")}
                                    </>
                                )}
                            </div>
                        </TableItem>
                    </TableRow>
                </tfoot>
            )}
        </Table>
    );
};
