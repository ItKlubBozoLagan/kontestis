import type { Contest, ContestMemberWithInfo } from "@kontestis/models";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Activity, CalendarClock, Megaphone, MessageSquare, Trophy, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import { contestQueries } from "@/api/contests";
import { problemQueries, type VisibleProblem } from "@/api/problems";
import { Section } from "@/components/common/Section";
import { StatCard } from "@/components/common/StatCard";
import { ContestPhaseBadge } from "@/components/contest/ContestPhaseBadge";
import { ContestSettings } from "@/features/management/overview/ContestSettings";
import { ReadinessChecklist } from "@/features/management/overview/ReadinessChecklist";
import { useContestSubmissions } from "@/features/management/overview/useContestSubmissions";
import { needsReply } from "@/features/management/shared/questions";
import { StandingsTable } from "@/features/management/shared/StandingsTable";
import { contestEnd } from "@/lib/contest";
import { formatDateTime } from "@/lib/format";

const StatusCard = ({ contest }: { contest: Contest }) => {
    const { t } = useTranslation();

    return (
        <StatCard
            className="col-span-2 lg:col-span-1"
            label={t("management.overview.status")}
            icon={CalendarClock}
            value={<ContestPhaseBadge contest={contest} className="text-sm" />}
            hint={`${formatDateTime(contest.start_time)} – ${formatDateTime(
                new Date(contestEnd(contest))
            )}`}
        />
    );
};

const Standings = ({
    members,
    problems,
    final = false,
}: {
    members: ContestMemberWithInfo[];
    problems: VisibleProblem[];
    final?: boolean;
}) => {
    const { t } = useTranslation();

    return (
        <Section
            title={
                final
                    ? t("management.overview.finished.finalStandings")
                    : t("management.overview.standings")
            }
            icon={Trophy}
            contentClassName="p-0 sm:p-4"
        >
            <StandingsTable members={members} problems={problems} />
        </Section>
    );
};

/** Upcoming contest: readiness checklist first, then the usual numbers and settings. */
export const UpcomingOverview = ({ contest }: { contest: Contest }) => {
    const { t } = useTranslation();
    const { data: members } = useSuspenseQuery(contestQueries.leaderboard(contest.id));
    const { data: problems } = useSuspenseQuery(problemQueries.byContest(contest.id));
    const { data: announcements } = useQuery(contestQueries.announcements(contest.id));
    const { data: questions } = useQuery(contestQueries.questions(contest.id));

    const unanswered = questions?.filter(needsReply).length;

    return (
        <div className="flex flex-col gap-6">
            <ReadinessChecklist contest={contest} />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                <StatusCard contest={contest} />
                <StatCard
                    label={t("management.overview.participants")}
                    icon={Users}
                    value={members.length}
                />
                <StatCard
                    label={t("management.overview.problems")}
                    icon={Trophy}
                    value={problems.length}
                />
                <StatCard
                    label={t("management.overview.announcements")}
                    icon={Megaphone}
                    value={announcements?.length ?? "–"}
                />
                <StatCard
                    label={t("management.overview.unansweredQuestions")}
                    icon={MessageSquare}
                    value={unanswered ?? "–"}
                    className={unanswered ? "border-amber-300" : undefined}
                />
            </div>
            <ContestSettings contest={contest} />
            <Standings members={members} problems={problems} />
        </div>
    );
};

const topScore = (members: ContestMemberWithInfo[], problems: VisibleProblem[]) =>
    members.reduce(
        (best, member) =>
            Math.max(
                best,
                problems.reduce(
                    (sum, problem) => sum + (member.score[problem.id.toString()] ?? 0),
                    0
                )
            ),
        0
    );

/** Finished contest: a compact summary and the final standings lead; settings follow. */
export const FinishedOverview = ({ contest }: { contest: Contest }) => {
    const { t } = useTranslation();
    const { data: members } = useSuspenseQuery(contestQueries.leaderboard(contest.id));
    const { data: problems } = useSuspenseQuery(problemQueries.byContest(contest.id));
    const submissions = useContestSubmissions(problems, false);

    const maxScore = problems.reduce((sum, problem) => sum + problem.score, 0);

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatusCard contest={contest} />
                <StatCard
                    label={t("management.overview.participants")}
                    icon={Users}
                    value={members.length}
                />
                <StatCard
                    label={t("management.overview.finished.submissions")}
                    icon={Activity}
                    value={submissions.isPending ? "–" : submissions.total}
                />
                <StatCard
                    className="col-span-2 lg:col-span-1"
                    label={t("management.overview.finished.topScore")}
                    icon={Trophy}
                    value={
                        <>
                            {topScore(members, problems)}
                            <span className="text-muted-foreground text-base font-normal">
                                /{maxScore}
                            </span>
                        </>
                    }
                />
            </div>
            <Standings members={members} problems={problems} final />
            <ContestSettings contest={contest} />
        </div>
    );
};
