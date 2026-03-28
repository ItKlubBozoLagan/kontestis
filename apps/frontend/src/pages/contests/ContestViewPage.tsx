import { AdminPermissions, hasAdminPermission } from "@kontestis/models";
import { FC, useMemo } from "react";
import { FiList } from "react-icons/all";
import { useParams } from "react-router";
import { Link } from "react-router-dom";

import { ProblemScoreBox } from "../../components/ProblemScoreBox";
import { Table, TableHeadItem, TableHeadRow, TableItem, TableRow } from "../../components/Table";
import { TitledSection } from "../../components/TitledSection";
import { useAllContestAnnouncements } from "../../hooks/contest/announcements/useAllContestAnnouncements";
import { useContest } from "../../hooks/contest/useContest";
import { useSelfContestMembers } from "../../hooks/contest/useSelfContestMembers";
import { useAllProblems } from "../../hooks/problem/useAllProblems";
import { useAllProblemScores } from "../../hooks/problem/useAllProblemScores";
import { ContestStatusStyleColorMap, useContestStatus } from "../../hooks/useContestStatus";
import { useTranslation } from "../../hooks/useTranslation";
import { useAuthStore } from "../../state/auth";
import { ContestChatSection } from "./ContestChatSection";
import { Leaderboard } from "./Leaderboard";

type Properties = {
    contestId: string;
};

export const ContestViewPage: FC = () => {
    const { contestId } = useParams<Properties>();

    const { user } = useAuthStore();

    const { data: contest } = useContest(BigInt(contestId ?? 0n));
    const { data: problems } = useAllProblems(contest?.id, {
        enabled: !!contest?.id,
    });

    const { data: announcements } = useAllContestAnnouncements(BigInt(contestId ?? 0n));
    const { data: selfMembers } = useSelfContestMembers();

    const selfMember = useMemo(
        () => selfMembers?.find((m) => m.contest_id === contest?.id),
        [selfMembers, contest]
    );

    const { t } = useTranslation();

    const running = useMemo(() => {
        if (!contest) return false;

        return (
            Date.now() > contest.start_time.getTime() &&
            Date.now() < contest.start_time.getTime() + 1000 * contest.duration_seconds
        );
    }, [contest]);

    const problemScores = useAllProblemScores();

    const contestStatus = useContestStatus(contest);

    if (!contest) return <div>{t("contests.page.loading")}</div>;

    return (
        <div tw={"w-full flex flex-col justify-start items-center gap-6 mt-5"}>
            <div tw={"text-neutral-800 text-3xl"}>{contest.name}</div>
            {contest && (
                <div
                    tw={
                        "border-2 border-solid border-neutral-200 py-2 px-4 text-lg flex justify-center"
                    }
                    style={{
                        backgroundColor: ContestStatusStyleColorMap[contestStatus.status],
                    }}
                >
                    {contestStatus.timeFormat}
                </div>
            )}
            {contest && running && (
                <div tw={"w-full flex justify-stretch gap-4"}>
                    <TitledSection
                        title={t("contests.individual.announcements.label")}
                        tw={"gap-y-2 w-full"}
                    >
                        {(announcements ?? []).map((announcement) => (
                            <span
                                tw={
                                    "w-full border-solid border-neutral-300 border-[2px] p-2 font-mono text-center"
                                }
                                key={announcement.id.toString()}
                            >
                                {announcement.message}
                            </span>
                        ))}
                    </TitledSection>
                    {selfMember && <ContestChatSection contestId={contest.id} />}
                </div>
            )}
            {(contestStatus.status !== "pending" ||
                // TODO: Replace with actual permission check
                (problems && problems.length > 0) ||
                hasAdminPermission(user.permissions, AdminPermissions.VIEW_CONTEST)) && (
                <Table tw={"w-full"}>
                    <thead>
                        <TableHeadRow>
                            <TableHeadItem>
                                {contest?.exam
                                    ? t("contests.individual.problems_table.examProblem")
                                    : t("contests.individual.problems_table.problem")}
                            </TableHeadItem>
                            <TableHeadItem>
                                {t("contests.individual.problems_table.score")}
                            </TableHeadItem>
                        </TableHeadRow>
                    </thead>
                    <tbody>
                        {problems
                            ?.sort((a, b) => {
                                if (a.score === b.score) return a.title.localeCompare(b.title);

                                return a.score - b.score;
                            })
                            .map((p) => (
                                <TableRow key={p.id.toString()}>
                                    <TableItem tw={"hover:(text-sky-800 cursor-pointer)"}>
                                        <Link
                                            to={"/problem/" + p.id}
                                            tw={"flex items-center gap-2"}
                                        >
                                            <FiList tw={"text-xl"} /> {p.title}
                                        </Link>
                                    </TableItem>
                                    <TableItem>
                                        <ProblemScoreBox
                                            score={
                                                problemScores.data
                                                    ? problemScores.data[p.id.toString()] ?? 0
                                                    : 0
                                            }
                                            maxScore={p.score}
                                        />
                                    </TableItem>
                                </TableRow>
                            ))}
                    </tbody>
                </Table>
            )}
            <Leaderboard contest={contest} problems={problems ?? []} />
        </div>
    );
};
