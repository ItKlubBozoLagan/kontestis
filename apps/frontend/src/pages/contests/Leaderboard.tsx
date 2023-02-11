import { Contest, ProblemWithScore } from "@kontestis/models";
import { FC } from "react";

import { ProblemScoreBox } from "../../components/ProblemScoreBox";
import { Table, TableHeadItem, TableHeadRow, TableItem, TableRow } from "../../components/Table";
import { useAllContestMembers } from "../../hooks/contest/useAllContestMembers";

type Properties = {
    contest: Contest;
    problems: ProblemWithScore[];
};

export const Leaderboard: FC<Properties> = ({ contest, problems }) => {
    const { isSuccess, data } = useAllContestMembers(contest.id);

    return (
        <Table tw={"w-full"}>
            <thead>
                <TableHeadRow>
                    <TableHeadItem>User</TableHeadItem>
                    {problems.map((problem) => (
                        <TableHeadItem key={problem.id + ""}>{problem.title}</TableHeadItem>
                    ))}
                </TableHeadRow>
            </thead>
            <tbody>
                {isSuccess &&
                    data.map((member) => (
                        <TableRow key={member.id + ""}>
                            <TableItem>{member.full_name}</TableItem>
                            {problems.map((problem) => (
                                <TableItem key={problem.id + ""}>
                                    <ProblemScoreBox
                                        score={member.score?.get(problem.id) ?? 0}
                                        maxScore={problem.score}
                                    />
                                </TableItem>
                            ))}
                        </TableRow>
                    ))}
            </tbody>
        </Table>
    );
};
