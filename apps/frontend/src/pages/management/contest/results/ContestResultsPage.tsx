import { FC } from "react";
import { FiFilePlus } from "react-icons/all";

import { ProblemScoreBox } from "../../../../components/ProblemScoreBox";
import {
    Table,
    TableHeadItem,
    TableHeadRow,
    TableItem,
    TableRow,
} from "../../../../components/Table";
import { useContestContext } from "../../../../context/constestContext";
import { useAllContestMembers } from "../../../../hooks/contest/participants/useAllContestMembers";
import { useAllProblems } from "../../../../hooks/problem/useAllProblems";

export const ContestResultsPage: FC = () => {
    const { contest } = useContestContext();

    const { data: members } = useAllContestMembers(contest.id);
    const { data: problems } = useAllProblems(contest.id);

    return (
        <Table tw={"w-full"}>
            <thead>
                <TableHeadRow>
                    <TableHeadItem>User</TableHeadItem>
                    <TableHeadItem>Points</TableHeadItem>
                    <TableHeadItem>Export</TableHeadItem>
                </TableHeadRow>
            </thead>
            <tbody>
                {(members ?? [])
                    .sort((a, b) => a.full_name.localeCompare(b.full_name))
                    .map((member) => (
                        <TableRow key={member.id.toString()}>
                            <TableItem>{member.full_name}</TableItem>
                            <TableItem>
                                <ProblemScoreBox
                                    score={Object.values(member.score).reduce(
                                        (accumulator, current) => accumulator + current,
                                        0
                                    )}
                                    maxScore={(problems ?? []).reduce((a, it) => a + it.score, 0)}
                                />
                            </TableItem>
                            <TableItem tw={"text-xl"}>
                                <FiFilePlus tw={"cursor-pointer hover:text-red-500"} />
                            </TableItem>
                        </TableRow>
                    ))}
            </tbody>
        </Table>
    );
};
