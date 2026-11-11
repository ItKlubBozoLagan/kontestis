import type { Contest } from "@kontestis/models";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { problemQueries } from "@/api/problems";
import { TagBadge } from "@/components/badges/TagBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { ExamTasks } from "@/features/contests/ExamTasks";
import {
    problemLetter,
    problemStatus,
    statusBar,
    statusChip,
} from "@/features/contests/problemStatus";
import { contestPhase } from "@/lib/contest";
import { cn } from "@/lib/utils";

/** Problems sorted like before: by points, then title. */
export const sortProblems = <T extends { score: number; title: string }>(problems: T[]) =>
    [...problems].sort((a, b) => a.score - b.score || a.title.localeCompare(b.title));

export const useContestProblems = (contestId: bigint) => {
    const query = useQuery(problemQueries.byContest(contestId));
    const sorted = useMemo(() => sortProblems(query.data ?? []), [query.data]);

    return { ...query, problems: sorted };
};

/**
 * The problem list of a contest: one real link per problem with the viewer's progress, so the
 * whole state of "what have I solved" is readable at a glance.
 */
export const ContestProblems = ({ contest }: { contest: Contest }) => {
    const { t } = useTranslation();
    const { problems, isPending } = useContestProblems(contest.id);
    const { data: scores } = useQuery(problemQueries.scores());

    if (isPending) return <Skeleton className="h-40 w-full" />;

    if (problems.length === 0)
        return (
            <EmptyState
                title={
                    contestPhase(contest) === "upcoming"
                        ? t(contest.exam ? "contests.exam.notStarted" : "contests.view.notStarted")
                        : t("contests.view.noProblems")
                }
            />
        );

    if (contest.exam) return <ExamTasks contest={contest} problems={problems} />;

    const total = problems.reduce((sum, problem) => sum + problem.score, 0);
    const mine = problems.reduce((sum, problem) => sum + (scores?.[problem.id.toString()] ?? 0), 0);

    return (
        <div className="flex flex-col">
            <ol className="divide-y">
                {problems.map((problem, index) => {
                    const score = scores?.[problem.id.toString()];
                    const status = problemStatus(score, problem.score);

                    return (
                        <li key={problem.id.toString()}>
                            <Link
                                to={`/problem/${problem.id}`}
                                className="hover:bg-muted/60 focus-visible:ring-ring group flex items-center gap-3 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-inset"
                            >
                                <span
                                    className={cn(
                                        "flex size-9 shrink-0 items-center justify-center rounded-md border text-sm font-semibold",
                                        statusChip[status]
                                    )}
                                >
                                    {problemLetter(index)}
                                </span>
                                <span className="flex min-w-0 flex-1 flex-col gap-1">
                                    <span className="truncate text-base font-medium">
                                        {problem.title}
                                    </span>
                                    {problem.tags.length > 0 && (
                                        <span className="flex flex-wrap gap-1">
                                            {[...problem.tags].sort().map((tag) => (
                                                <TagBadge key={tag} tag={tag} />
                                            ))}
                                        </span>
                                    )}
                                </span>
                                <span className="flex w-24 shrink-0 flex-col items-end gap-1.5">
                                    <span className="font-mono text-sm tabular-nums">
                                        <span
                                            className={cn(
                                                "font-semibold",
                                                status === "unattempted" && "text-muted-foreground"
                                            )}
                                        >
                                            {score ?? "–"}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {" / "}
                                            {problem.score}
                                        </span>
                                    </span>
                                    <span className="bg-muted h-1 w-full overflow-hidden rounded-full">
                                        <span
                                            className={cn("block h-full", statusBar[status])}
                                            style={{
                                                width: `${
                                                    problem.score > 0
                                                        ? Math.min(
                                                              100,
                                                              ((score ?? 0) / problem.score) * 100
                                                          )
                                                        : 0
                                                }%`,
                                            }}
                                        />
                                    </span>
                                </span>
                                {status === "full" && (
                                    <Check
                                        className="size-4 shrink-0 text-green-600"
                                        aria-label={t("verdicts.accepted")}
                                    />
                                )}
                                <ChevronRight className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                        </li>
                    );
                })}
            </ol>
            <div className="bg-muted/40 flex items-center justify-between gap-2 border-t px-4 py-3 text-sm">
                <span className="text-muted-foreground">{t("contests.view.totalScore")}</span>
                <span className="font-mono text-base font-semibold tabular-nums">
                    {mine}
                    <span className="text-muted-foreground font-normal"> / {total}</span>
                </span>
            </div>
        </div>
    );
};
