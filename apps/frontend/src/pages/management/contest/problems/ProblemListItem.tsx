import { ProblemWithScore } from "@kontestis/models";
import { FC, useMemo } from "react";
import { Link } from "react-router-dom";

import { ProblemScoreBox } from "../../../../components/ProblemScoreBox";
import { TableItem, TableRow } from "../../../../components/Table";
import { useGlobalProblemSubmissions } from "../../../../hooks/submission/useGlobalProblemSubmissions";

type Properties = {
    problem: ProblemWithScore;
};

export const ProblemListItem: FC<Properties> = ({ problem }) => {
    const { data: submissions } = useGlobalProblemSubmissions(problem.id);

    const unique = useMemo(
        () => new Set((submissions ?? []).map((submission) => submission.user_id)),
        [submissions]
    );

    return (
        <TableRow>
            <TableItem>
                <Link to={problem.id + ""} tw={"hover:(text-sky-800 cursor-pointer)"}>
                    {problem.title}
                </Link>
            </TableItem>
            <TableItem>{problem.score}</TableItem>
            <TableItem>{unique.size}</TableItem>
            <TableItem>
                <ProblemScoreBox
                    score={
                        (submissions ?? []).filter(
                            (submission) => submission.verdict === "accepted"
                        ).length
                    }
                    maxScore={(submissions ?? []).length}
                />
            </TableItem>
        </TableRow>
    );
};
