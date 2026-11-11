import type { Cluster, Contest } from "@kontestis/models";
import { useQueries, useSuspenseQuery } from "@tanstack/react-query";
import {
    ChevronDown,
    CircleCheck,
    CircleX,
    ListChecks,
    LoaderCircle,
    type LucideIcon,
    TriangleAlert,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { contestQueries } from "@/api/contests";
import { problemQueries } from "@/api/problems";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
    type CheckStatus,
    type ReadinessCheck,
    readinessChecks,
    type ReadinessSummary,
    summarise,
} from "@/features/management/overview/readiness";
import { useNow } from "@/hooks/useNow";
import { cn } from "@/lib/utils";

const PENDING_POLL = 10_000;

const icons: Record<CheckStatus, LucideIcon> = {
    pass: CircleCheck,
    warn: TriangleAlert,
    fail: CircleX,
    loading: LoaderCircle,
};

const tones: Record<CheckStatus, string> = {
    pass: "text-green-600 dark:text-green-400",
    warn: "text-amber-600 dark:text-amber-400",
    fail: "text-red-600 dark:text-red-400",
    loading: "text-muted-foreground animate-spin",
};

const badgeTones: Record<CheckStatus, string> = {
    pass: "border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200",
    warn: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
    fail: "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
    loading: "text-muted-foreground",
};

/**
 * Loads what the checklist needs: the problem list, the clusters of every problem and the
 * testcase list of every scored cluster (one request per cluster, never per testcase).
 */
const useReadiness = (contest: Contest) => {
    const { t } = useTranslation();
    const now = useNow();
    const { data: problems } = useSuspenseQuery(problemQueries.byContest(contest.id));
    const { data: members } = useSuspenseQuery(contestQueries.leaderboard(contest.id));

    const clusterResults = useQueries({
        queries: problems.map((problem) => ({
            ...problemQueries.clusters(problem.id),
            // slow poll: a cluster can stay "pending" for a long time
            refetchInterval: (query: { state: { data?: Cluster[] } }) =>
                query.state.data?.some((cluster) => cluster.status === "pending")
                    ? PENDING_POLL
                    : false,
        })),
    });

    const scoredClusters = clusterResults.flatMap((result) =>
        (result.data ?? []).filter((cluster) => !cluster.is_sample)
    );

    const testcaseResults = useQueries({
        queries: scoredClusters.map((cluster) => ({
            ...problemQueries.testcases(cluster.problem_id, cluster.id),
            select: (testcases: unknown[]) => testcases.length,
        })),
    });

    const clusters = new Map(
        problems.map((problem, index) => [problem.id.toString(), clusterResults[index]?.data])
    );
    const testcaseCounts = new Map(
        scoredClusters.map((cluster, index) => [
            cluster.id.toString(),
            testcaseResults[index]?.data,
        ])
    );

    const checks = readinessChecks({
        contest,
        problems,
        clusters,
        testcaseCounts,
        participants: members.length,
        now,
        t,
    });

    return { checks, summary: summarise(checks) };
};

const SummaryBadge = ({ summary }: { summary: ReadinessSummary }) => {
    const { t } = useTranslation();
    const { status, fails, warnings } = summary;

    const label =
        status === "fail"
            ? fails === 1
                ? t("management.overview.readiness.failOne")
                : t("management.overview.readiness.failMany", { count: fails })
            : status === "warn"
            ? warnings === 1
                ? t("management.overview.readiness.warningOne")
                : t("management.overview.readiness.warningMany", { count: warnings })
            : status === "pass"
            ? t("management.overview.readiness.ready")
            : t("management.overview.readiness.checking");
    const Icon = icons[status];

    return (
        <Badge variant="outline" className={cn("gap-1.5 text-sm", badgeTones[status])}>
            <Icon className={cn("size-3.5!", status === "loading" && "animate-spin")} />
            {label}
        </Badge>
    );
};

const CheckRow = ({ check }: { check: ReadinessCheck }) => {
    const { t } = useTranslation();
    const Icon = icons[check.status];
    const failing = check.status === "fail" || check.status === "warn";

    return (
        <li className="flex items-start gap-3 py-2.5">
            <Icon className={cn("mt-0.5 size-5 shrink-0", tones[check.status])} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium">{check.title}</span>
                <span className="text-muted-foreground text-sm break-words">{check.detail}</span>
            </div>
            {check.href && (
                <Button
                    asChild
                    variant={failing ? "outline" : "ghost"}
                    size="xs"
                    className="shrink-0"
                >
                    <Link to={check.href}>
                        {failing
                            ? t("management.overview.readiness.fix")
                            : t("management.overview.readiness.view")}
                    </Link>
                </Button>
            )}
        </li>
    );
};

const CheckList = ({ checks }: { checks: ReadinessCheck[] }) => (
    <ul className="divide-y px-4">
        {checks.map((check) => (
            <CheckRow key={check.id} check={check} />
        ))}
    </ul>
);

const Header = ({ summary, children }: { summary: ReadinessSummary; children?: ReactNode }) => {
    const { t } = useTranslation();

    return (
        <div className="bg-muted/70 flex min-h-11 flex-wrap items-center justify-between gap-2 px-4 py-2">
            <h2 className="flex items-center gap-2 text-base font-medium">
                <ListChecks className="text-muted-foreground size-4" />
                {t("management.overview.readiness.title")}
            </h2>
            <div className="flex items-center gap-2">
                <SummaryBadge summary={summary} />
                {children}
            </div>
        </div>
    );
};

/** Upcoming contests: the full checklist, always open. */
export const ReadinessChecklist = ({ contest }: { contest: Contest }) => {
    const { checks, summary } = useReadiness(contest);

    return (
        <section className="bg-card overflow-hidden rounded-md border">
            <div className="border-b">
                <Header summary={summary} />
            </div>
            <CheckList checks={checks} />
        </section>
    );
};

/**
 * Running contests: only the summary line, and only when a check fails. The details can still
 * be expanded.
 */
export const CollapsedReadiness = ({ contest }: { contest: Contest }) => {
    const { t } = useTranslation();
    const { checks, summary } = useReadiness(contest);
    const [open, setOpen] = useState(false);
    const unresolved = checks.filter((it) => it.status === "fail" || it.status === "warn");

    if (summary.fails === 0) return null;

    return (
        <Collapsible
            open={open}
            onOpenChange={setOpen}
            className="bg-card overflow-hidden rounded-md border border-red-300 dark:border-red-900"
        >
            <Header summary={summary}>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="xs">
                        {open
                            ? t("management.overview.readiness.hide")
                            : t("management.overview.readiness.show")}
                        <ChevronDown className={cn("transition-transform", open && "rotate-180")} />
                    </Button>
                </CollapsibleTrigger>
            </Header>
            <CollapsibleContent className="border-t">
                <CheckList checks={unresolved} />
            </CollapsibleContent>
        </Collapsible>
    );
};
