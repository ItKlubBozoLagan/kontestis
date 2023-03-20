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

    const unique = useMemo(() => {
        const unique = new Set();

        for (const s of submissions ?? []) unique.add(s.user_id);

        return unique;
    }, [submissions]);

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
                    score={(submissions ?? []).filter((s) => s.verdict === "accepted").length}
                    maxScore={(submissions ?? []).length}
                />
            </TableItem>
        </TableRow>
    );
};
