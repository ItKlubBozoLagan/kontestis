import { Contest, ProblemWithScore } from "@kontestis/models";
import { FC, useMemo } from "react";

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

    const contestMembers = useMemo(
        () =>
            isSuccess
                ? data
                      .map((member) => {
                          return {
                              ...member,
                              total_score: problems.reduce((accumulator, current) => {
                                  return (
                                      accumulator +
                                      (member.score
                                          ? (member.score as unknown as Record<string, number>)[
                                                current.id + ""
                                            ] ?? 0
                                          : 0)
                                  );
                              }, 0),
                          };
                      })
                      .sort((a, b) => b.total_score - a.total_score)
                : [],
        [data]
    );

    return (
        <Table tw={"w-full"}>
            <thead>
                <TableHeadRow>
                    <TableHeadItem>Leaderboard</TableHeadItem>
                    {problems.map((problem) => (
                        <TableHeadItem key={problem.id + ""}>{problem.title}</TableHeadItem>
                    ))}
                    <TableHeadItem>Total</TableHeadItem>
                </TableHeadRow>
            </thead>
            <tbody>
                {isSuccess &&
                    contestMembers.map((member) => (
                        <TableRow key={member.id + ""}>
                            <TableItem>{member.full_name}</TableItem>
                            {problems.map((problem) => (
                                <TableItem key={problem.id + ""}>
                                    <ProblemScoreBox
                                        score={
                                            member.score
                                                ? (
                                                      member.score as unknown as Record<
                                                          string,
                                                          number
                                                      >
                                                  )[problem.id + ""] ?? 0
                                                : 0
                                        }
                                        maxScore={problem.score}
                                    />
                                </TableItem>
                            ))}
                            <TableItem>
                                <ProblemScoreBox score={member.total_score} maxScore={maxScore} />
                            </TableItem>
                        </TableRow>
                    ))}
            </tbody>
        </Table>
    );
};
