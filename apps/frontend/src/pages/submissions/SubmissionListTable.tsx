import {
    ProblemWithScore,
    SubmissionByProblemResponse,
    SubmissionWithUserInfo,
} from "@kontestis/models";
import { FC, useEffect, useState } from "react";
import { AiFillCaretDown, AiFillCaretUp } from "react-icons/all";
import { useQueryClient } from "react-query";
import { Link } from "react-router-dom";
import tw from "twin.macro";

import { ProblemScoreBox } from "../../components/ProblemScoreBox";
import { Table, TableHeadItem, TableHeadRow, TableItem, TableRow } from "../../components/Table";
import { useContest } from "../../hooks/contest/useContest";
import { useAllFinalSubmissions } from "../../hooks/submission/useAllFinalSubmissions";
import { useSetFinalSubmission } from "../../hooks/submission/useSetFinalSubmission";
import { useTranslation } from "../../hooks/useTranslation";
import { useAuthStore } from "../../state/auth";

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

    const setFinalSubmission = useSetFinalSubmission();

    const queryClient = useQueryClient();

    const { t } = useTranslation();

    useEffect(() => {
        if (!setFinalSubmission.isSuccess) return;

        queryClient.invalidateQueries(["submission", "final", contest!.id, user.id]);

        setFinalSubmission.reset();
    }, [setFinalSubmission.isSuccess]);

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
                    ?.sort((b, a) => Number(BigInt(a.id) - BigInt(b.id)))
                    .slice(0, expanded || submissions.length <= 4 ? submissions.length : 3)
                    .map((s) => (
                        <TableRow key={s.id.toString()}>
                            {!("completed" in s) || s.completed ? (
                                <>
                                    {adminView && !("completed" in s) && (
                                        <TableItem>{s.full_name}</TableItem>
                                    )}
                                    <TableItem
                                        css={
                                            s.verdict === "accepted"
                                                ? tw`text-green-600`
                                                : tw`text-red-600`
                                        }
                                    >
                                        <Link to={"/submission/" + s.id}>{s.verdict}</Link>
                                    </TableItem>
                                    <TableItem>{`${s.time_used_millis} ms`}</TableItem>
                                    <TableItem>{`${s.memory_used_megabytes} MiB`}</TableItem>
                                    <TableItem>{s.language}</TableItem>
                                    <TableItem>
                                        <ProblemScoreBox
                                            score={s.awarded_score}
                                            maxScore={problem.score}
                                        />
                                    </TableItem>
                                    {!adminView && contest && contest.exam && (
                                        <TableItem>
                                            {(finalSubmissions ?? []).some(
                                                (fs) => fs.submission_id === s.id
                                            ) ? (
                                                <span tw={"text-green-600"}>
                                                    {t("submissions.table.body.final")}
                                                </span>
                                            ) : contest.start_time.getTime() <= Date.now() &&
                                              contest.start_time.getTime() +
                                                  contest.duration_seconds * 1000 >=
                                                  Date.now() ? (
                                                <span
                                                    tw={"text-red-500 cursor-pointer"}
                                                    onClick={() => {
                                                        setFinalSubmission.mutate(s.id);
                                                    }}
                                                >
                                                    {t("submissions.table.body.notFinal")}
                                                </span>
                                            ) : (
                                                <span tw={"text-neutral-600"}>
                                                    {t("submissions.table.body.notExam")}
                                                </span>
                                            )}
                                        </TableItem>
                                    )}
                                </>
                            ) : (
                                <TableItem colSpan={100} tw={"text-center text-yellow-800"}>
                                    {t("submissions.processing")}
                                </TableItem>
                            )}
                        </TableRow>
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
