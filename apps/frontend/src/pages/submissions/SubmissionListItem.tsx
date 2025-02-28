import {
    Contest,
    ExamFinalSubmissionWithProblemId,
    ProblemWithScore,
    SubmissionByProblemResponse,
    SubmissionWithUserInfo,
} from "@kontestis/models";
import { FC, useEffect, useState } from "react";
import { FiLoader } from "react-icons/all";
import { Link } from "react-router-dom";
import tw from "twin.macro";

import { ProblemScoreBox } from "../../components/ProblemScoreBox";
import { TableItem, TableRow } from "../../components/Table";
import { Translated } from "../../components/Translated";
import { useSetFinalSubmission } from "../../hooks/submission/useSetFinalSubmission";
import { useInterval } from "../../hooks/useInterval";
import { useTranslation } from "../../hooks/useTranslation";
import { useAuthStore } from "../../state/auth";

type Properties = {
    submission: SubmissionByProblemResponse | SubmissionWithUserInfo;
    adminView: boolean;
    problem: ProblemWithScore;
    contest?: Contest;
    finalSubmissions?: ExamFinalSubmissionWithProblemId[];
};

export const SubmissionListItem: FC<Properties> = ({
    submission,
    adminView,
    problem,
    contest,
    finalSubmissions,
}) => {
    const { user } = useAuthStore();

    const setFinalSubmission = useSetFinalSubmission([contest?.id ?? 0n, user.id]);

    const { t } = useTranslation();

    const [dots, setDots] = useState("");

    useInterval(() => {
        setDots((dots) => {
            if (dots === "...") return "".padEnd(3, " ");

            return `${dots.trimEnd()}.`.padEnd(3, " ");
        });
    }, 400);

    useEffect(() => {
        if (!setFinalSubmission.isSuccess) return;

        setFinalSubmission.reset();
    }, [setFinalSubmission.isSuccess]);

    return (
        <TableRow key={submission.id.toString()}>
            {!("completed" in submission) || submission.completed ? (
                <>
                    {adminView && !("completed" in submission) && (
                        <TableItem>{submission.full_name}</TableItem>
                    )}
                    <TableItem
                        css={
                            submission.verdict === "accepted"
                                ? tw`text-green-600`
                                : tw`text-red-600`
                        }
                    >
                        <Link to={"/submission/" + submission.id}>{submission.verdict}</Link>
                    </TableItem>
                    <TableItem>{`${submission.time_used_millis} ms`}</TableItem>
                    <TableItem>{`${submission.memory_used_megabytes} MiB`}</TableItem>
                    <TableItem>{submission.language}</TableItem>
                    <TableItem>
                        <ProblemScoreBox
                            score={submission.awarded_score}
                            maxScore={problem.score}
                        />
                    </TableItem>
                    {!adminView && contest && contest.exam && (
                        <TableItem>
                            {(finalSubmissions ?? []).some(
                                (finalSubmission) => finalSubmission.submission_id === submission.id
                            ) ? (
                                <span tw={"text-green-600"}>
                                    {t("submissions.table.body.final")}
                                </span>
                            ) : contest.start_time.getTime() <= Date.now() &&
                              contest.start_time.getTime() + contest.duration_seconds * 1000 >=
                                  Date.now() ? (
                                <span
                                    tw={"text-red-500 cursor-pointer"}
                                    onClick={() => {
                                        setFinalSubmission.mutate(submission.id);
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
                <TableItem colSpan={100} tw={""}>
                    <div tw={"w-full text-yellow-800 flex items-center justify-center gap-2"}>
                        <FiLoader size={16} tw={"animate-spin-slow"} />
                        <pre tw={"m-0"}>
                            <Translated translationKey={"submissions.processing"}>
                                {dots}
                            </Translated>
                        </pre>
                    </div>
                </TableItem>
            )}
        </TableRow>
    );
};
