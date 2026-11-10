import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckSquare, Clock, Code, Cpu, Database } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";

import { contestQueries } from "@/api/contests";
import { problemQueries } from "@/api/problems";
import { submissionQueries } from "@/api/submissions";
import { ScoreBadge } from "@/components/badges/ScoreBadge";
import { TagBadge } from "@/components/badges/TagBadge";
import { Markdown } from "@/components/common/Markdown";
import { PageHeader } from "@/components/common/PageHeader";
import { Section } from "@/components/common/Section";
import { ContestPhaseBadge } from "@/components/contest/ContestPhaseBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubmitPanel } from "@/features/problems/SubmitPanel";
import { SubmissionsTable } from "@/features/submissions/SubmissionsTable";
import { useContestAccess } from "@/hooks/useContestAccess";
import { useNow } from "@/hooks/useNow";
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
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
        <span className="text-muted-foreground flex items-center gap-2">
            <Icon className="size-4" />
            {label}
        </span>
        <span className="font-mono font-medium">{value}</span>
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
    const canSeeAll = access.canViewPrivate || contestPhase(contest, now) === "finished";

    return (
        <>
            <Link
                to={`/contest/${contest.id}`}
                className="text-muted-foreground hover:text-primary -mb-3 flex w-fit items-center gap-1.5 text-sm"
            >
                <ArrowLeft className="size-4" />
                {contest.name}
            </Link>
            <PageHeader
                title={problem.title}
                actions={
                    <>
                        {problem.tags.map((tag) => (
                            <TagBadge key={tag} tag={tag} />
                        ))}
                        <ContestPhaseBadge contest={contest} />
                    </>
                }
            />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
                <Section
                    title={t("problems.individual.statement")}
                    className="h-fit"
                    contentClassName="p-5"
                >
                    <Markdown>{problem.description}</Markdown>
                </Section>
                <div className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
                    <Section
                        title={t("problems.individual.limits.title")}
                        contentClassName="divide-y py-1"
                    >
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
                        <Limit
                            icon={Cpu}
                            label={t("problems.individual.limits.variant")}
                            value={t(`evaluationVariants.${problem.evaluation_variant}`)}
                        />
                        <Limit
                            icon={CheckSquare}
                            label={t("problems.individual.limits.points")}
                            value={problem.score}
                        />
                        <Limit
                            icon={CheckSquare}
                            label={t("problems.individual.bestScore")}
                            value={
                                <ScoreBadge score={best} max={problem.score} dimWhenUnattempted />
                            }
                        />
                    </Section>
                    <Section title={t("problems.individual.submit.title")}>
                        <SubmitPanel problem={problem} contest={contest} />
                    </Section>
                </div>
            </div>
            <Tabs defaultValue="mine" className="w-full">
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
