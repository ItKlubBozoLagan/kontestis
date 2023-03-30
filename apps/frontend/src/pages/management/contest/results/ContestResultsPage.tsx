import { Snowflake } from "@kontestis/models";
import { FC } from "react";
import { FiFilePlus } from "react-icons/all";

import { http } from "../../../../api/http";
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

    const downloadClickHandler = async (userId: Snowflake) => {
        const response = await http
            .get<Blob>(`/contest/${contest.id}/export/${userId}`, {
                responseType: "blob",
            })
            .then((response) => {
                console.log(response.headers);

                return {
                    data: response.data,
                    fileName: (response.headers["content-disposition"] as string).split("=")[1],
                };
            });

        const linkElement = window.document.createElement("a");

        linkElement.href = URL.createObjectURL(response.data);
        linkElement.download = response.fileName;
        linkElement.click();

        URL.revokeObjectURL(linkElement.href);
    };

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
                            <TableItem
                                tw={"text-xl"}
                                onClick={() => downloadClickHandler(member.user_id)}
                            >
                                <FiFilePlus tw={"cursor-pointer hover:text-red-500"} />
                            </TableItem>
                        </TableRow>
                    ))}
            </tbody>
        </Table>
    );
};
