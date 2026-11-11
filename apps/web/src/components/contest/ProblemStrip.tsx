import type { Contest } from "@kontestis/models";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { problemQueries } from "@/api/problems";
import { ContestClockInline } from "@/components/contest/ContestClock";
import { useContestProblems } from "@/features/contests/ContestProblems";
import { examChip, useExamFinals } from "@/features/contests/examFinals";
import { problemLetter, problemStatus, statusChip } from "@/features/contests/problemStatus";
import { cn } from "@/lib/utils";

/**
 * Sticky bar shown on every problem of a contest: the way back, one chip per problem coloured
 * by the viewer's progress, and the countdown. Switching problems is one click and the clock
 * never scrolls away.
 */
export const ProblemStrip = ({ contest, currentId }: { contest: Contest; currentId: bigint }) => {
    const { t } = useTranslation();
    const { problems } = useContestProblems(contest.id);
    const { data: scores } = useQuery(problemQueries.scores());
    const { byProblem: finals } = useExamFinals(contest);

    /** Exams colour chips by "final submission chosen", contests by score. */
    const chipState = (problem: { id: bigint; score: number }) => {
        if (contest.exam) {
            const chosen = finals.has(problem.id.toString());

            return {
                className: chosen ? examChip.chosen : examChip.missing,
                done: chosen,
                label: chosen ? t("contests.exam.finalChosen") : t("contests.exam.noFinal"),
            };
        }

        const score = scores?.[problem.id.toString()];
        const status = problemStatus(score, problem.score);

        return {
            className: statusChip[status],
            done: status === "full",
            label:
                score === undefined
                    ? t("problems.individual.notAttempted")
                    : `${score}/${problem.score}`,
        };
    };

    return (
        <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-14 z-30 -mx-4 -mt-6 flex items-center gap-3 border-b px-4 py-2 backdrop-blur sm:-mx-8 sm:-mt-8 sm:px-8">
            <Link
                to={`/contest/${contest.id}`}
                className="text-muted-foreground hover:text-primary flex min-w-0 shrink items-center gap-1.5 text-sm"
            >
                <ArrowLeft className="size-4 shrink-0" />
                <span className="hidden max-w-56 truncate md:inline">{contest.name}</span>
            </Link>
            <nav
                aria-label={t(
                    contest.exam ? "problems.individual.examStrip" : "problems.individual.strip"
                )}
                className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-1"
            >
                {problems.map((problem, index) => {
                    const state = chipState(problem);
                    const current = problem.id === currentId;
                    const progress = state.label;

                    return (
                        <Link
                            key={problem.id.toString()}
                            to={`/problem/${problem.id}`}
                            aria-current={current ? "page" : undefined}
                            aria-label={`${problemLetter(index)} · ${problem.title} · ${progress}`}
                            title={`${problem.title} · ${progress}`}
                            className={cn(
                                "focus-visible:ring-ring flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-md border px-2 text-sm font-semibold outline-none focus-visible:ring-2",
                                state.className,
                                current
                                    ? "ring-primary ring-2 ring-offset-1"
                                    : "opacity-90 hover:opacity-100"
                            )}
                        >
                            {state.done && <Check className="size-3.5" />}
                            {problemLetter(index)}
                            {current && (
                                <span className="hidden max-w-40 truncate font-medium lg:inline">
                                    {problem.title}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>
            <ContestClockInline contest={contest} className="shrink-0" />
        </div>
    );
};
