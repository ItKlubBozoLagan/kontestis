import { ContestMemberPermissions } from "@kontestis/models";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
    CalendarClock,
    CheckCircle2,
    GraduationCap,
    Hourglass,
    Settings,
    Trophy,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams, useSearchParams } from "react-router";

import { contestQueries } from "@/api/contests";
import { ContestPhaseBadge } from "@/components/contest/ContestPhaseBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContestAnnouncements } from "@/features/contests/ContestAnnouncements";
import { ContestLeaderboard } from "@/features/contests/ContestLeaderboard";
import { ContestProblems } from "@/features/contests/ContestProblems";
import { ContestQuestions } from "@/features/contests/ContestQuestions";
import { RegisterButton } from "@/features/contests/RegisterButton";
import { useContestAccess } from "@/hooks/useContestAccess";
import { useNow } from "@/hooks/useNow";
import { contestEnd, contestPhase } from "@/lib/contest";
import { formatDateTime, formatSeconds } from "@/lib/format";

const TABS = ["problems", "leaderboard", "questions"] as const;

type Tab = (typeof TABS)[number];

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
    const [params, setParams] = useSearchParams();
    const { data: contest } = useSuspenseQuery(contestQueries.detail(contestId));
    const access = useContestAccess(contest);
    const phase = contestPhase(contest, useNow());

    const requested = params.get("tab") as Tab | null;
    const tab: Tab = requested && TABS.includes(requested) ? requested : "problems";
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
                            <ContestPhaseBadge contest={contest} />
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

            <ContestAnnouncements contest={contest} alwaysShow={phase === "running"} />

            <Tabs
                value={tab}
                onValueChange={(value) => setParams({ tab: value }, { replace: true })}
            >
                <TabsList>
                    <TabsTrigger value="problems">
                        {contest.exam
                            ? t("contests.view.examProblems")
                            : t("contests.view.problems")}
                    </TabsTrigger>
                    <TabsTrigger value="leaderboard">{t("contests.leaderboard.title")}</TabsTrigger>
                    <TabsTrigger value="questions">{t("contests.questions.title")}</TabsTrigger>
                </TabsList>
                <TabsContent value="problems" className="pt-2">
                    <ContestProblems contest={contest} />
                </TabsContent>
                <TabsContent value="leaderboard" className="pt-2">
                    <ContestLeaderboard contest={contest} canViewPrivate={access.canViewPrivate} />
                </TabsContent>
                <TabsContent value="questions" className="pt-2">
                    <ContestQuestions
                        contest={contest}
                        registered={access.isRegistered}
                        canViewQuestions={canViewQuestions}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
};
