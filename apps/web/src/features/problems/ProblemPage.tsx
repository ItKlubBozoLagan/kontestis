import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { CheckSquare, Clock, Code, Cpu, Database, Send } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";

import { contestQueries } from "@/api/contests";
import { problemQueries } from "@/api/problems";
import { submissionQueries } from "@/api/submissions";
import { ScoreBadge } from "@/components/badges/ScoreBadge";
import { TagBadge } from "@/components/badges/TagBadge";
import { Markdown } from "@/components/common/Markdown";
import { Section } from "@/components/common/Section";
import { ProblemStrip } from "@/components/contest/ProblemStrip";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useExamFinals } from "@/features/contests/examFinals";
import { SubmitPanel } from "@/features/problems/SubmitPanel";
import { SubmissionsTable } from "@/features/submissions/SubmissionsTable";
import { useContestAccess } from "@/hooks/useContestAccess";
import { useNow } from "@/hooks/useNow";
import { usePageTitle } from "@/hooks/usePageTitle";
import { contestPhase } from "@/lib/contest";

const Limit = ({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Clock;
    label: string;
    value: ReactNode;
}) => (
    <div className="flex items-center gap-2">
        <dt className="text-muted-foreground flex items-center gap-1.5">
            <Icon className="size-4" />
            {label}
        </dt>
        <dd className="font-mono font-medium tabular-nums">{value}</dd>
    </div>
);

export const ProblemPage = () => {
    const { t } = useTranslation();
    const { problemId = "0" } = useParams();
    const now = useNow();
    const { data: problem } = useSuspenseQuery(problemQueries.detail(problemId));
    const { data: contest } = useSuspenseQuery(contestQueries.detail(problem.contest_id));
    // derived from the (polled) submission list so it updates as soon as an evaluation finishes
    const { data: mySubmissions } = useQuery(submissionQueries.byProblem(problem.id));
    const access = useContestAccess(contest);

    const best = mySubmissions?.reduce<number | undefined>(
        (max, it) => (it.completed ? Math.max(max ?? 0, it.awarded_score) : max),
        undefined
    );
    const examFinal = useExamFinals(contest).byProblem.get(problem.id.toString());
    const canSeeAll = access.canViewPrivate || contestPhase(contest, now) === "finished";

    usePageTitle(problem.title);

    return (
        <>
            <ProblemStrip contest={contest} currentId={problem.id} />
            <header className="flex flex-col gap-3 border-b-2 border-neutral-400 pb-3 dark:border-neutral-600">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="min-w-0 text-2xl font-normal tracking-tight break-words sm:text-3xl">
                        {problem.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2">
                        {problem.tags.map((tag) => (
                            <TagBadge key={tag} tag={tag} />
                        ))}
                        <Button asChild size="sm" className="lg:hidden">
                            <a href="#submit">
                                <Send />
                                {t("problems.individual.submit.jump")}
                            </a>
                        </Button>
                    </div>
                </div>
                <dl className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
                    <Limit
                        icon={Clock}
                        label={t("problems.individual.limits.time")}
                        value={`${problem.time_limit_millis} ms`}
                    />
                    <Limit
                        icon={Database}
                        label={t("problems.individual.limits.memory")}
                        value={`${problem.memory_limit_megabytes} MiB`}
                    />
                    <Limit
                        icon={Code}
                        label={t("problems.individual.limits.sourceSize")}
                        value="64 KiB"
                    />
                    {problem.evaluation_variant !== "plain" && (
                        <Limit
                            icon={Cpu}
                            label={t("problems.individual.limits.variant")}
                            value={t(`evaluationVariants.${problem.evaluation_variant}`)}
                        />
                    )}
                    {contest.exam ? (
                        <Limit
                            icon={CheckSquare}
                            label={t("problems.exam.finalLabel")}
                            value={
                                examFinal ? (
                                    <ScoreBadge score={examFinal.final_score} max={problem.score} />
                                ) : (
                                    <span className="font-sans text-amber-700 dark:text-amber-400">
                                        {t("problems.exam.notChosen")}
                                    </span>
                                )
                            }
                        />
                    ) : (
                        <Limit
                            icon={CheckSquare}
                            label={t("problems.individual.bestScore")}
                            value={
                                <ScoreBadge score={best} max={problem.score} dimWhenUnattempted />
                            }
                        />
                    )}
                </dl>
            </header>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
                <article className="min-w-0">
                    <Markdown className="prose-p:leading-relaxed">{problem.description}</Markdown>
                </article>
                <div id="submit" className="scroll-mt-32 lg:sticky lg:top-32">
                    <Section title={t("problems.individual.submit.title")} icon={Send}>
                        <SubmitPanel problem={problem} contest={contest} />
                    </Section>
                </div>
            </div>
            <Tabs id="submissions" defaultValue="mine" className="w-full scroll-mt-32">
                <TabsList>
                    <TabsTrigger value="mine">
                        {t("problems.individual.submissions.mine")}
                    </TabsTrigger>
                    {canSeeAll && (
                        <TabsTrigger value="all">
                            {t("problems.individual.submissions.all")}
                        </TabsTrigger>
                    )}
                </TabsList>
                <TabsContent value="mine">
                    <SubmissionsTable mode="mine" problem={problem} contest={contest} />
                </TabsContent>
                {canSeeAll && (
                    <TabsContent value="all">
                        <SubmissionsTable
                            mode="all"
                            problem={problem}
                            contest={contest}
                            canRejudge={access.canEdit}
                        />
                    </TabsContent>
                )}
            </Tabs>
        </>
    );
};
