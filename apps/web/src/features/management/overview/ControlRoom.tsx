import type { Contest } from "@kontestis/models";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Activity, MessageSquare, Trophy, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import { contestQueries } from "@/api/contests";
import { problemQueries } from "@/api/problems";
import { Section } from "@/components/common/Section";
import { StatCard } from "@/components/common/StatCard";
import { ContestClock } from "@/components/contest/ContestClock";
import { AnnouncementComposer } from "@/features/management/overview/AnnouncementComposer";
import { CollapsiblePanel, ContestSettings } from "@/features/management/overview/ContestSettings";
import { QuestionQueue } from "@/features/management/overview/QuestionQueue";
import { CollapsedReadiness } from "@/features/management/overview/ReadinessChecklist";
import { SubmissionFeed } from "@/features/management/overview/SubmissionFeed";
import { useContestSubmissions } from "@/features/management/overview/useContestSubmissions";
import { needsReply } from "@/features/management/shared/questions";
import { StandingsTable } from "@/features/management/shared/StandingsTable";
import { cn } from "@/lib/utils";

const KeyNumbers = ({
    participants,
    submissions,
    waiting,
}: {
    participants: number;
    submissions: number | undefined;
    waiting: number | undefined;
}) => {
    const { t } = useTranslation();

    return (
        <div className="grid grid-cols-3 gap-3">
            <StatCard
                label={t("management.overview.participants")}
                icon={Users}
                value={participants}
            />
            <StatCard
                label={t("management.overview.control.submissions")}
                icon={Activity}
                value={submissions ?? "–"}
            />
            <StatCard
                label={t("management.overview.control.unanswered")}
                icon={MessageSquare}
                value={waiting ?? "–"}
                className={cn(
                    waiting &&
                        "border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
                )}
            />
        </div>
    );
};

/**
 * Running contest: everything an organiser watches during the contest on one screen. On large
 * screens the queue and feed sit left and the clock, composer and numbers right; on small
 * screens the columns dissolve (`contents`) and `order` puts the queue right after the clock.
 */
export const ControlRoom = ({ contest }: { contest: Contest }) => {
    const { t } = useTranslation();
    const { data: members } = useSuspenseQuery(contestQueries.leaderboard(contest.id));
    const { data: problems } = useSuspenseQuery(problemQueries.byContest(contest.id));
    const { data: threads } = useQuery(contestQueries.questions(contest.id));
    const submissions = useContestSubmissions(problems, true);

    const waiting = threads?.filter(needsReply).length;

    return (
        <div className="flex flex-col gap-6">
            <CollapsedReadiness contest={contest} />
            <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-6">
                <div className="contents lg:flex lg:flex-col lg:gap-6">
                    <QuestionQueue contestId={contest.id} threads={threads} className="order-2" />
                    <SubmissionFeed
                        submissions={submissions.recent}
                        isPending={submissions.isPending}
                        className="order-5"
                    />
                </div>
                <div className="contents lg:flex lg:flex-col lg:gap-4">
                    <ContestClock contest={contest} className="order-1" />
                    <AnnouncementComposer contestId={contest.id} className="order-3" />
                    <div className="order-4">
                        <KeyNumbers
                            participants={members.length}
                            submissions={submissions.isPending ? undefined : submissions.total}
                            waiting={waiting}
                        />
                    </div>
                </div>
            </div>
            <Section
                title={t("management.overview.standings")}
                icon={Trophy}
                contentClassName="p-0 sm:p-4"
            >
                <StandingsTable members={members} problems={problems} />
            </Section>
            <CollapsiblePanel
                title={t("management.overview.control.settings")}
                hint={t("management.overview.control.settingsHint")}
            >
                <ContestSettings contest={contest} />
            </CollapsiblePanel>
        </div>
    );
};
