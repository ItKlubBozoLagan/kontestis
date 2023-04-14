import { ExamGradingScale, Snowflake } from "@kontestis/models";
import { FC, useMemo, useState } from "react";
import { FiFilePlus, FiPlus } from "react-icons/all";
import { Link } from "react-router-dom";

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
import { useTranslation } from "../../../../hooks/useTranslation";
import { R } from "../../../../util/remeda";
import { CreateGradingScaleModal } from "./CreateGradingScaleModal";
import { GradingScaleListItem } from "./GradingScaleListItem";
import { ResultsTableReviewedItem } from "./ResultsTableReviewedItem";

const calculateGradeFromScale = (
    scales: ExamGradingScale[],
    [score, totalScore]: [number, number]
) => {
    return scales
        .sort((a, b) => b.percentage - a.percentage)
        .find((scale) => score >= Math.floor((scale.percentage / 100) * totalScore))?.grade;
};

export const ContestResultsPage: FC = () => {
    const { contest } = useContestContext();

    const { data: members } = useAllContestMembers(contest.id);
    const { data: problems } = useAllProblems(contest.id);
    const { data: gradingScales } = useAllContestGradingScales(contest.id);

    const [modalOpen, setModalOpen] = useState(false);

    const maxScore = useMemo(
        () => (problems ?? []).reduce((accumulator, it) => accumulator + it.score, 0),
        [problems]
    );

    const memberScores = useMemo(
        () =>
            R.fromPairs(
                (members ?? []).map((member) => [
                    member.id.toString(),
                    Object.values(member.exam_score).reduce(
                        (accumulator, current) => accumulator + current,
                        0
                    ),
                ])
            ),
        [members, problems]
    );

    const memberGrades = useMemo(
        () =>
            R.fromPairs(
                !gradingScales || gradingScales.length === 0
                    ? []
                    : (members ?? []).map((member) => [
                          member.id.toString(),
                          calculateGradeFromScale(gradingScales, [
                              memberScores[member.id.toString()],
                              maxScore,
                          ]),
                      ])
            ),
        [members, gradingScales, memberScores]
    );

    const downloadClickHandler = async (userId: Snowflake) => {
        const response = await http
            .get<Blob>(`/contest/${contest.id}/export/${userId}`, {
                responseType: "blob",
            })
            .then((response) => {
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

    const { t } = useTranslation();

    return (
        <div tw={"w-full flex flex-col gap-5"}>
            <div tw={"w-4/5 self-center"}>
                <TitledSection
                    title={t("contests.management.individual.results.gradingScale.title")}
                    tw={"items-end"}
                >
                    <SimpleButton prependIcon={FiPlus} onClick={() => setModalOpen(true)}>
                        {t("contests.management.individual.results.gradingScale.createButton")}
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
                        <TableHeadItem>
                            {t("contests.management.individual.results.table.head.user")}
                        </TableHeadItem>
                        <TableHeadItem>
                            {t("contests.management.individual.results.table.head.points")}
                        </TableHeadItem>
                        <TableHeadItem>
                            {t("contests.management.individual.results.table.head.reviewed")}
                        </TableHeadItem>
                        <TableHeadItem>
                            {t("contests.management.individual.results.table.head.exports")}
                        </TableHeadItem>
                    </TableHeadRow>
                </thead>
                <tbody>
                    {(members ?? [])
                        .sort((a, b) => a.full_name.localeCompare(b.full_name))
                        .map((member) => (
                            <TableRow key={member.id.toString()}>
                                <TableItem>
                                    <Link to={`${member.user_id}`}>{member.full_name}</Link>
                                </TableItem>
                                <TableItem>
                                    <div tw={"flex gap-2"}>
                                        <ProblemScoreBox
                                            score={memberScores[member.id.toString()]}
                                            maxScore={maxScore}
                                        />
                                        {memberGrades[member.id.toString()] && (
                                            <span>{` (${
                                                memberGrades[member.id.toString()]
                                            })`}</span>
                                        )}
                                    </div>
                                </TableItem>
                                <ResultsTableReviewedItem member={member} />
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
