import type { Contest } from "@kontestis/models";
import { AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import type { VisibleProblem } from "@/api/problems";
import { TagBadge } from "@/components/badges/TagBadge";
import { examChip, useExamFinals } from "@/features/contests/examFinals";
import { problemLetter } from "@/features/contests/problemStatus";
import { useContestAccess } from "@/hooks/useContestAccess";
import { useNow } from "@/hooks/useNow";
import { contestPhase } from "@/lib/contest";
import { cn } from "@/lib/utils";

const FinalState = ({
    score,
    max,
    running,
}: {
    score: number | undefined;
    max: number;
    running: boolean;
}) => {
    const { t } = useTranslation();

    if (score !== undefined)
        return (
            <span className="flex flex-col items-end gap-0.5 text-right">
                <span className="flex items-center gap-1 text-sm font-medium text-sky-800 dark:text-sky-300">
                    <CheckCircle2 className="size-4 shrink-0" />
                    {t("contests.exam.finalChosen")}
                </span>
                <span className="text-muted-foreground font-mono text-xs tabular-nums">
                    {t("contests.exam.finalPoints", { score, max })}
                </span>
            </span>
        );

    return (
        <span className="flex flex-col items-end gap-0.5 text-right">
            <span
                className={cn(
                    "flex items-center gap-1 text-sm font-medium",
                    running ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"
                )}
            >
                {running && <AlertTriangle className="size-4 shrink-0" />}
                {t("contests.exam.noFinal")}
            </span>
            <span className="text-muted-foreground font-mono text-xs tabular-nums">
                {t("contests.exam.maxPoints", { max })}
            </span>
        </span>
    );
};

/**
 * Task list of an exam. Only the final submission of each task is graded, so instead of the best
 * score the participant sees which tasks already have a final submission.
 */
export const ExamTasks = ({
    contest,
    problems,
}: {
    contest: Contest;
    problems: VisibleProblem[];
}) => {
    const { t } = useTranslation();
    const access = useContestAccess(contest);
    const { byProblem } = useExamFinals(contest, access.isRegistered);
    const running = contestPhase(contest, useNow()) === "running";
    const chosen = problems.filter((problem) => byProblem.has(problem.id.toString())).length;

    return (
        <div className="flex flex-col">
            <ol className="divide-y">
                {problems.map((problem, index) => {
                    const final = byProblem.get(problem.id.toString());

                    return (
                        <li key={problem.id.toString()}>
                            <Link
                                to={`/problem/${problem.id}`}
                                className="hover:bg-muted/60 focus-visible:ring-ring group flex items-center gap-3 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-inset"
                            >
                                <span
                                    className={cn(
                                        "flex size-9 shrink-0 items-center justify-center rounded-md border text-sm font-semibold",
                                        final ? examChip.chosen : examChip.missing
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
                                {access.isRegistered ? (
                                    <FinalState
                                        score={final?.final_score}
                                        max={problem.score}
                                        running={running}
                                    />
                                ) : (
                                    <span className="text-muted-foreground font-mono text-sm tabular-nums">
                                        {t("contests.exam.maxPoints", { max: problem.score })}
                                    </span>
                                )}
                                <ChevronRight className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                        </li>
                    );
                })}
            </ol>
            {access.isRegistered && (
                <div className="bg-muted/40 flex flex-col gap-1 border-t px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">
                            {t("contests.exam.finalsChosen")}
                        </span>
                        <span className="font-mono text-base font-semibold tabular-nums">
                            {chosen}
                            <span className="text-muted-foreground font-normal">
                                {" "}
                                / {problems.length}
                            </span>
                        </span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                        {running
                            ? t("contests.exam.howItWorks")
                            : t("contests.exam.howItWorksOver")}
                    </p>
                </div>
            )}
        </div>
    );
};
