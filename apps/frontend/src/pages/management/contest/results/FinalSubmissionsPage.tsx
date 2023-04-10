import { FC } from "react";
import { useParams } from "react-router";
import { Link } from "react-router-dom";

import { ProblemScoreBox } from "../../../../components/ProblemScoreBox";
import {
    Table,
    TableHeadItem,
    TableHeadRow,
    TableItem,
    TableRow,
} from "../../../../components/Table";
import { useContestContext } from "../../../../context/constestContext";
import { useAllProblems } from "../../../../hooks/problem/useAllProblems";
import { useAllFinalSubmissions } from "../../../../hooks/submission/final/useAllFinalSubmissions";

type Properties = {
    user_id: string;
};

export const FinalSubmissionsPage: FC = () => {
    const { contest } = useContestContext();

    const { user_id } = useParams<Properties>();

    const { data: finalSubmissions } = useAllFinalSubmissions([contest.id, BigInt(user_id ?? 0)]);

    const { data: problems } = useAllProblems(contest.id);

    return (
        <div tw={"w-full"}>
            <Table tw={"w-full"}>
                <thead>
                    <TableHeadRow>
                        <TableHeadItem>Problem</TableHeadItem>
                        <TableHeadItem>Points</TableHeadItem>
                        <TableHeadItem>Reviewed</TableHeadItem>
                    </TableHeadRow>
                </thead>
                <tbody>
                    {(problems ?? []).map((problem) => {
                        const finalSubmission = (finalSubmissions ?? []).find(
                            (finalSubmission) => finalSubmission.problem_id === problem.id
                        );

                        return (
                            <TableRow key={problem.id.toString()}>
                                <TableItem>
                                    <Link
                                        to={finalSubmission ? `/review/${finalSubmission.id}` : ""}
                                    >
                                        {problem.title}
                                    </Link>
                                </TableItem>
                                <TableItem>
                                    <ProblemScoreBox
                                        score={finalSubmission?.final_score ?? 0}
                                        maxScore={problem.score}
                                    />
                                </TableItem>
                                <TableItem>
                                    {finalSubmission ? (
                                        finalSubmission.reviewed ? (
                                            <span tw={"text-green-600"}>Reviewed</span>
                                        ) : (
                                            <span tw={"text-red-600"}>Not reviewed</span>
                                        )
                                    ) : (
                                        <span tw={"text-red-600"}>No Submission</span>
                                    )}
                                </TableItem>
                            </TableRow>
                        );
                    })}
                </tbody>
            </Table>
        </div>
    );
};
