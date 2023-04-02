import { Snowflake } from "@kontestis/models";
import { FC, useState } from "react";
import { FiFilePlus, FiPlus } from "react-icons/all";

import { http } from "../../../../api/http";
import { ProblemScoreBox } from "../../../../components/ProblemScoreBox";
import { SimpleButton } from "../../../../components/SimpleButton";
import {
    Table,
    TableHeadItem,
    TableHeadRow,
    TableItem,
    TableRow,
} from "../../../../components/Table";
import { TitledSection } from "../../../../components/TitledSection";
import { useContestContext } from "../../../../context/constestContext";
import { useAllContestGradingScales } from "../../../../hooks/contest/grading/useAllContestGradingScales";
import { useAllContestMembers } from "../../../../hooks/contest/participants/useAllContestMembers";
import { useAllProblems } from "../../../../hooks/problem/useAllProblems";
import { CreateGradingScaleModal } from "./CreateGradingScaleModal";
import { GradingScaleListItem } from "./GradingScaleListItem";

export const ContestResultsPage: FC = () => {
    const { contest } = useContestContext();

    const { data: members } = useAllContestMembers(contest.id);
    const { data: problems } = useAllProblems(contest.id);
    const { data: gradingScales } = useAllContestGradingScales(contest.id);

    const [modalOpen, setModalOpen] = useState(false);

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
        <div tw={"w-full flex flex-col gap-5"}>
            <div tw={"w-4/5 self-center"}>
                <TitledSection title={"Grading Scale"} tw={"items-end"}>
                    <SimpleButton prependIcon={FiPlus} onClick={() => setModalOpen(true)}>
                        Create grading scale
                    </SimpleButton>
                    <CreateGradingScaleModal
                        isOpen={modalOpen}
                        onRequestClose={() => setModalOpen(false)}
                        onAfterClose={() => setModalOpen(false)}
                    />
                    {(gradingScales ?? [])
                        .sort((a, b) => b.percentage - a.percentage)
                        .map((gradingScale) => (
                            <GradingScaleListItem
                                gradingScale={gradingScale}
                                key={gradingScale.id.toString()}
                            />
                        ))}
                </TitledSection>
            </div>
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
                                        maxScore={(problems ?? []).reduce(
                                            (a, it) => a + it.score,
                                            0
                                        )}
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
        </div>
    );
};
