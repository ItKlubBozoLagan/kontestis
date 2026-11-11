import type { ProblemSummary } from "@kontestis/models";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleDashed, Dumbbell } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { problemQueries } from "@/api/problems";
import { ScoreBadge } from "@/components/badges/ScoreBadge";
import { Section } from "@/components/common/Section";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { contestPhase } from "@/lib/contest";

const LIMIT = 5;

const isSolved = (problem: ProblemSummary) =>
    problem.best_score !== null && problem.score > 0 && problem.best_score >= problem.score;

const isFinished = (problem: ProblemSummary) =>
    contestPhase({
        start_time: problem.contest_start_time,
        duration_seconds: problem.contest_duration_seconds,
    }) === "finished";

const byNewest = (a: ProblemSummary, b: ProblemSummary) =>
    b.contest_start_time.getTime() - a.contest_start_time.getTime();

/** Attempted-but-unsolved problems of finished contests first, then untouched ones. */
const pickPractice = (problems: ProblemSummary[]) => {
    const finished = problems.filter(isFinished);
    const unfinished = finished.filter((it) => it.attempts > 0 && !isSolved(it)).sort(byNewest);
    const fresh = finished.filter((it) => it.attempts === 0).sort(byNewest);

    return [...unfinished, ...fresh].slice(0, LIMIT);
};

const PracticeRow = ({ problem }: { problem: ProblemSummary }) => {
    const { t } = useTranslation();
    const Icon = isSolved(problem) ? CheckCircle2 : CircleDashed;

    return (
        <li>
            <Link
                to={`/problem/${problem.id}`}
                className="hover:bg-muted/60 focus-visible:ring-ring flex items-center justify-between gap-3 px-4 py-3 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset"
            >
                <span className="flex min-w-0 items-center gap-2">
                    <Icon className="text-muted-foreground size-4 shrink-0" />
                    <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">{problem.title}</span>
                        <span className="text-muted-foreground truncate text-xs">
                            {t("dashboard.practice.from", { contest: problem.contest_name })}
                            {" · "}
                            {problem.attempts > 0
                                ? t("dashboard.practice.unfinished")
                                : t("dashboard.practice.new")}
                        </span>
                    </span>
                </span>
                <ScoreBadge score={problem.best_score} max={problem.score} dimWhenUnattempted />
            </Link>
        </li>
    );
};

/** Up to five problems worth coming back to; a plain link card when there are none. */
export const PracticeSection = () => {
    const { t } = useTranslation();
    const { data, isPending } = useQuery(problemQueries.summaries());
    const picks = useMemo(() => pickPractice(data ?? []), [data]);

    const all = (
        <Button variant="ghost" size="sm" asChild>
            <Link to="/problems">{t("dashboard.practice.all")}</Link>
        </Button>
    );

    return (
        <Section
            title={t("dashboard.practice.title")}
            icon={Dumbbell}
            actions={all}
            contentClassName="p-0"
        >
            {isPending ? (
                <Skeleton className="m-4 h-24" />
            ) : picks.length === 0 ? (
                <p className="text-muted-foreground p-4 text-sm">
                    {t("dashboard.practice.fallback")}
                </p>
            ) : (
                <ul className="divide-y">
                    {picks.map((problem) => (
                        <PracticeRow key={problem.id.toString()} problem={problem} />
                    ))}
                </ul>
            )}
        </Section>
    );
};
