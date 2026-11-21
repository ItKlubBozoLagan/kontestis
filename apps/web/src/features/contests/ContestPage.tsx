import { ContestMemberPermissions } from "@kontestis/models";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
    CalendarClock,
    CheckCircle2,
    GraduationCap,
    Hourglass,
    ListChecks,
    MessageSquare,
    Settings,
    Trophy,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";

import { contestQueries } from "@/api/contests";
import { Section } from "@/components/common/Section";
import { ContestClock } from "@/components/contest/ContestClock";
import { ContestPhaseBadge } from "@/components/contest/ContestPhaseBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContestAnnouncements } from "@/features/contests/ContestAnnouncements";
import { ContestLeaderboard } from "@/features/contests/ContestLeaderboard";
import { ContestProblems } from "@/features/contests/ContestProblems";
import { ContestQuestions } from "@/features/contests/ContestQuestions";
import { ContestStanding } from "@/features/contests/ContestStanding";
import { RegisterButton } from "@/features/contests/RegisterButton";
import { useContestAccess } from "@/hooks/useContestAccess";
import { useNow } from "@/hooks/useNow";
import { usePageTitle } from "@/hooks/usePageTitle";
import { contestEnd, contestPhase } from "@/lib/contest";
import { formatDateTime, formatSeconds } from "@/lib/format";

const Fact = ({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof CalendarClock;
    label: string;
    value: string;
}) => (
    <div className="flex items-center gap-2">
        <Icon className="text-muted-foreground size-4" />
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">{value}</span>
    </div>
);

export const ContestPage = () => {
    const { t } = useTranslation();
    const { contestId = "0" } = useParams();
    const { data: contest } = useSuspenseQuery(contestQueries.detail(contestId));
    const access = useContestAccess(contest);
    const phase = contestPhase(contest, useNow());

    usePageTitle(contest.name);

    const canViewQuestions = access.can(ContestMemberPermissions.VIEW_QUESTIONS);

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-4 border-b-2 border-neutral-400 pb-4 dark:border-neutral-600">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-2">
                        <h1 className="text-2xl font-normal tracking-tight break-words sm:text-3xl">
                            {contest.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2">
                            <ContestPhaseBadge contest={contest} showCountdown={false} />
                            {contest.official && (
                                <Badge variant="outline" className="gap-1">
                                    <Trophy className="size-3 text-amber-500" />
                                    {t("contests.view.official")}
                                </Badge>
                            )}
                            {contest.exam && (
                                <Badge variant="outline" className="gap-1">
                                    <GraduationCap className="size-3" />
                                    {t("contests.view.exam")}
                                </Badge>
                            )}
                            {access.isRegistered && (
                                <Badge
                                    variant="outline"
                                    className="gap-1 border-green-300 text-green-700 dark:text-green-400"
                                >
                                    <CheckCircle2 className="size-3" />
                                    {t("contests.table.registered")}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {!access.isRegistered && phase !== "finished" && (
                            <RegisterButton contest={contest} size="default" />
                        )}
                        {access.canViewPrivate && (
                            <Button variant="outline" asChild>
                                <Link to={`/management/${contest.id}`}>
                                    <Settings />
                                    {t("contests.view.manage")}
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <Fact
                        icon={CalendarClock}
                        label={t("contests.view.starts")}
                        value={formatDateTime(contest.start_time)}
                    />
                    <Fact
                        icon={CalendarClock}
                        label={t("contests.view.ends")}
                        value={formatDateTime(new Date(contestEnd(contest)))}
                    />
                    <Fact
                        icon={Hourglass}
                        label={t("contests.view.duration")}
                        value={formatSeconds(contest.duration_seconds)}
                    />
                </div>
                {!access.isRegistered && phase !== "finished" && (
                    <p className="text-muted-foreground text-sm">
                        {t("contests.view.notRegisteredHint")}
                    </p>
                )}
            </header>

            <ContestClock contest={contest} className="lg:hidden" />

            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
                <Section
                    title={
                        contest.exam ? t("contests.view.examProblems") : t("contests.view.problems")
                    }
                    icon={ListChecks}
                    contentClassName="p-0"
                >
                    <ContestProblems contest={contest} />
                </Section>

                <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:col-start-2">
                    <ContestClock contest={contest} className="hidden lg:flex" />
                    {access.isRegistered && phase !== "upcoming" && (
                        <ContestStanding contest={contest} canViewPrivate={access.canViewPrivate} />
                    )}
                    <ContestAnnouncements contest={contest} alwaysShow={phase === "running"} />
                    {(access.isRegistered || canViewQuestions) && (
                        <Section
                            title={t("contests.questions.title")}
                            icon={MessageSquare}
                            contentClassName="p-3"
                        >
                            <ContestQuestions
                                contest={contest}
                                registered={access.isRegistered}
                                canViewQuestions={canViewQuestions}
                            />
                        </Section>
                    )}
                </aside>
            </div>

            {/* an exam is graded from reviewed final submissions, so a live best-score ranking
                of classmates is misleading; staff still see it */}
            {(!contest.exam || access.canViewPrivate) && (
                <div id="leaderboard" className="min-w-0 scroll-mt-20">
                    <ContestLeaderboard contest={contest} canViewPrivate={access.canViewPrivate} />
                </div>
            )}
        </div>
    );
};
