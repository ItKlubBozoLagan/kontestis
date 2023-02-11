import { Contest, ProblemWithScore } from "@kontestis/models";
import { FC, useMemo } from "react";
import * as R from "remeda";

import { ProblemScoreBox } from "../../components/ProblemScoreBox";
import { Table, TableHeadItem, TableHeadRow, TableItem, TableRow } from "../../components/Table";
import { useAllContestMembers } from "../../hooks/contest/useAllContestMembers";

type Properties = {
    contest: Contest;
    problems: ProblemWithScore[];
};

export const Leaderboard: FC<Properties> = ({ contest, problems }) => {
    const { isSuccess, data } = useAllContestMembers(contest.id);

    const maxScore = problems.reduce((accumulator, current) => accumulator + current.score, 0);

    const contestMembers = useMemo(() => {
        if (!isSuccess) return [];

        return data
            .map((it) =>
                R.addProp(
                    it,
                    "total_score",
                    Object.values(it.score).reduce((accumulator, current) => accumulator + current)
                )
            )
            .sort((a, b) => b.total_score - a.total_score);
    }, [isSuccess, data]);

    return (
        <div tw={"w-full flex flex-col gap-4 pt-4"}>
            <span tw={"text-2xl"}>Live leaderboard</span>
            <Table>
                <thead>
                    <TableHeadRow>
                        <TableHeadItem>Contestant</TableHeadItem>
                        {problems.map((problem) => (
                            <TableHeadItem key={problem.id.toString()}>
                                {problem.title}
                            </TableHeadItem>
                        ))}
                        <TableHeadItem>Total</TableHeadItem>
                    </TableHeadRow>
                </thead>
                <tbody>
                    {isSuccess &&
                        contestMembers.map((member) => (
                            <TableRow key={member.id.toString()}>
                                <TableItem>{member.full_name}</TableItem>
                                {problems.map((problem) => (
                                    <TableItem key={problem.id.toString()}>
                                        <ProblemScoreBox
                                            score={
                                                member.score
                                                    ? member.score[problem.id.toString()] ?? 0
                                                    : 0
                                            }
                                            maxScore={problem.score}
                                        />
                                    </TableItem>
                                ))}
                                <TableItem>
                                    <ProblemScoreBox
                                        score={member.total_score}
                                        maxScore={maxScore}
                                    />
                                </TableItem>
                            </TableRow>
                        ))}
                </tbody>
            </Table>
        </div>
    );
};
