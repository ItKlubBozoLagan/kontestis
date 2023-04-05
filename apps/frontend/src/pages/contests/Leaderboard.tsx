import { Contest, ProblemWithScore } from "@kontestis/models";
import React, { FC, useMemo } from "react";
import tw from "twin.macro";

import { ProblemScoreBox } from "../../components/ProblemScoreBox";
import { Table, TableHeadItem, TableHeadRow, TableItem, TableRow } from "../../components/Table";
import { useAllContestMembers } from "../../hooks/contest/participants/useAllContestMembers";
import { useTranslation } from "../../hooks/useTranslation";
import { useAuthStore } from "../../state/auth";
import { R } from "../../util/remeda";

type Properties = {
    contest: Contest;
    problems: ProblemWithScore[];
};

export const Leaderboard: FC<Properties> = ({ contest, problems }) => {
    const { isSuccess, data } = useAllContestMembers(contest.id);
    const { user } = useAuthStore();

    const maxScore = problems.reduce((accumulator, current) => accumulator + current.score, 0);

    const { t } = useTranslation();

    const contestMembers = useMemo(() => {
        if (!isSuccess) return [];

        return data
            .map((it) =>
                R.addProp(
                    it,
                    "total_score",
                    Object.values(it.score).reduce(
                        (accumulator, current) => accumulator + current,
                        0
                    )
                )
            )
            .sort((a, b) => b.total_score - a.total_score);
    }, [isSuccess, data]);

    const contestEnded =
        Date.now() >= contest.start_time.getTime() + contest.duration_seconds * 1000;

    if (Date.now() <= contest.start_time.getTime()) return <></>;

    return (
        <div tw={"w-full flex flex-col gap-4 pt-4"}>
            <span tw={"text-2xl"}>
                {contestEnded
                    ? t("contests.individual.leaderboard.finished")
                    : t("contests.individual.leaderboard.running")}
            </span>
            <Table>
                <thead>
                    <TableHeadRow>
                        <TableHeadItem>
                            {t("contests.individual.leaderboard.table.contestant")}
                        </TableHeadItem>
                        {problems.map((problem) => (
                            <TableHeadItem key={problem.id.toString()}>
                                {problem.title}
                            </TableHeadItem>
                        ))}
                        <TableHeadItem>
                            {t("contests.individual.leaderboard.table.total")}
                        </TableHeadItem>
                    </TableHeadRow>
                </thead>
                <tbody>
                    {data?.length === 0 && (
                        <TableItem colSpan={100} tw={"text-center"}>
                            {t("contests.individual.leaderboard.emptyMessage")}
                        </TableItem>
                    )}
                    {isSuccess &&
                        contestMembers.map((member, index) => (
                            <TableRow key={member.id.toString()}>
                                <TableItem
                                    css={
                                        [
                                            tw`text-yellow-600`,
                                            tw`text-neutral-600`,
                                            tw`text-yellow-800`,
                                        ][index] ??
                                        (member.user_id === user.id ? tw`text-blue-600` : "")
                                    }
                                >
                                    {member.full_name}
                                </TableItem>
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
