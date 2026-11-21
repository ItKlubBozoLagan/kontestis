import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
    Activity,
    Bell,
    CalendarClock,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Layers,
    Send,
    Target,
    Trophy,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { useCurrentUser } from "@/api/auth";
import { contestQueries } from "@/api/contests";
import { notificationQueries } from "@/api/notifications";
import { statsQueries } from "@/api/stats";
import { SubmissionActivity } from "@/components/charts/SubmissionActivity";
import { EmptyState } from "@/components/common/EmptyState";
import { Section } from "@/components/common/Section";
import { StatCard } from "@/components/common/StatCard";
import { ContestPhaseBadge } from "@/components/contest/ContestPhaseBadge";
import { JoinContestDialog } from "@/components/contest/JoinContestDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDateLocale } from "@/hooks/useDateLocale";
import { compareContests, contestPhase } from "@/lib/contest";
import { formatDateTime, formatPercent } from "@/lib/format";

const Overview = () => {
    const { t } = useTranslation();
    const { data, isPending } = useQuery(statsQueries.overview());

    if (isPending || !data)
        return (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                    <Skeleton key={index} className="h-24" />
                ))}
            </div>
        );

    return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
                label={t("dashboard.stats.contests")}
                value={data.contests}
                icon={Trophy}
                hint={t("dashboard.stats.contestsHint", {
                    running: data.running_contests,
                    upcoming: data.upcoming_contests,
                })}
            />
            <StatCard label={t("dashboard.stats.problems")} value={data.problems} icon={Layers} />
            <StatCard
                label={t("dashboard.stats.submissions")}
                value={data.submissions}
                icon={Send}
                hint={
                    data.submissions > 0
                        ? t("dashboard.stats.acceptedHint", {
                              rate: formatPercent(data.accepted_submissions / data.submissions),
                          })
                        : undefined
                }
            />
            <StatCard
                label={t("dashboard.stats.solved")}
                value={data.solved_problems}
                icon={Target}
                hint={t("dashboard.stats.solvedHint", { total: data.problems })}
            />
        </div>
    );
};

const UpcomingContests = () => {
    const { t } = useTranslation();
    const { data: contests } = useSuspenseQuery(contestQueries.all());

    const active = useMemo(
        () =>
            contests
                .filter((contest) => contestPhase(contest) !== "finished")
                .sort((a, b) => compareContests(a, b))
                .slice(0, 6),
        [contests]
    );

    return (
        <Section
            title={t("dashboard.upcoming.title")}
            icon={CalendarClock}
            actions={
                <Button variant="ghost" size="sm" asChild>
                    <Link to="/contests">{t("dashboard.upcoming.all")}</Link>
                </Button>
            }
            contentClassName="p-0"
        >
            {active.length === 0 ? (
                <EmptyState title={t("dashboard.upcoming.empty")} className="py-8" />
            ) : (
                <ul className="divide-y">
                    {active.map((contest) => (
                        <li key={contest.id.toString()}>
                            <Link
                                to={`/contest/${contest.id}`}
                                className="hover:bg-muted/60 flex flex-wrap items-center justify-between gap-2 px-4 py-3 transition-colors"
                            >
                                <span className="flex min-w-0 flex-col">
                                    <span className="truncate font-medium">{contest.name}</span>
                                    <span className="text-muted-foreground font-mono text-xs">
                                        {formatDateTime(contest.start_time)}
                                    </span>
                                </span>
                                <span className="flex items-center gap-2">
                                    {contest.registered && (
                                        <Badge
                                            variant="outline"
                                            className="gap-1 border-green-300 text-green-700 dark:text-green-400"
                                        >
                                            <CheckCircle2 className="size-3" />
                                            {t("dashboard.upcoming.registered")}
                                        </Badge>
                                    )}
                                    <ContestPhaseBadge contest={contest} />
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </Section>
    );
};

const SiteAlerts = () => {
    const { t } = useTranslation();
    const locale = useDateLocale();
    const [expanded, setExpanded] = useState(false);
    const { data: notifications = [] } = useQuery(notificationQueries.all());

    const alerts = useMemo(
        () =>
            notifications
                .filter((it) => it.type === "alert")
                .sort((a, b) => b.created_at.getTime() - a.created_at.getTime()),
        [notifications]
    );

    return (
        <Section
            title={t("dashboard.alerts.title")}
            icon={Bell}
            contentClassName="flex flex-col gap-2"
        >
            {alerts.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center">
                    {t("dashboard.alerts.none")}
                </p>
            ) : (
                <>
                    {alerts.slice(0, expanded ? 8 : 2).map((alert) => (
                        <div
                            key={alert.id.toString()}
                            className="bg-muted/50 flex flex-col gap-1 rounded-md border px-3 py-2"
                        >
                            <time
                                className="text-muted-foreground text-xs"
                                title={formatDateTime(alert.created_at)}
                            >
                                {formatDistanceToNow(alert.created_at, { addSuffix: true, locale })}
                            </time>
                            <span className="whitespace-pre-line">{alert.data}</span>
                        </div>
                    ))}
                    {alerts.length > 2 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="self-center"
                            onClick={() => setExpanded((it) => !it)}
                        >
                            {expanded ? <ChevronUp /> : <ChevronDown />}
                            {expanded
                                ? t("dashboard.alerts.collapse")
                                : t("dashboard.alerts.older")}
                        </Button>
                    )}
                </>
            )}
        </Section>
    );
};

export const DashboardPage = () => {
    const { t } = useTranslation();
    const user = useCurrentUser();

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3 py-2 text-center">
                <img
                    src="/evaluatorLogo.png"
                    alt="Kontestis Evaluator"
                    className="size-36 dark:invert-[.9]"
                />
                <p className="text-muted-foreground">
                    {t("dashboard.welcome", { name: user.full_name })}
                </p>
                <JoinContestDialog />
            </div>
            <Overview />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <UpcomingContests />
                <SiteAlerts />
            </div>
            <section className="flex flex-col gap-3">
                <h2 className="flex items-center gap-2 text-lg font-normal">
                    <Activity className="text-muted-foreground size-4" />
                    {t("dashboard.activity.title")}
                </h2>
                <SubmissionActivity />
            </section>
        </div>
    );
};
