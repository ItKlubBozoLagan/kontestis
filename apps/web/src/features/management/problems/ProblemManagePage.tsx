import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Cpu, ExternalLink, Gauge, Layers, MemoryStick, Timer, Trash2, Wand2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";

import { problemQueries, useDeleteProblem, useUpdateProblem } from "@/api/problems";
import { TagBadge } from "@/components/badges/TagBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Section } from "@/components/common/Section";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pollingClusters } from "@/features/management/clusters/clusterQueries";
import { ClustersTable } from "@/features/management/clusters/ClustersTable";
import { CreateClusterDialog } from "@/features/management/clusters/CreateClusterDialog";
import { AuthoringBreadcrumb } from "@/features/management/problems/AuthoringBreadcrumb";
import { ProblemForm, problemToValues } from "@/features/management/problems/ProblemForm";
import { ProblemSubmissionsTable } from "@/features/management/problems/ProblemSubmissionsTable";
import { useManagedContest } from "@/features/management/useManagedContest";
import { useContestAccess } from "@/hooks/useContestAccess";

const TABS = ["clusters", "settings", "submissions"] as const;

export const ProblemManagePage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const contest = useManagedContest();
    const { canEdit } = useContestAccess(contest);
    const { problemId = "0" } = useParams<{ problemId: string }>();
    const [params, setParams] = useSearchParams();
    const { data: problem } = useSuspenseQuery(problemQueries.detail(problemId));
    const { data: clusters = [] } = useQuery(pollingClusters(problem.id));
    const update = useUpdateProblem(problem.id);
    const remove = useDeleteProblem();

    const tab = TABS.find((it) => it === params.get("tab")) ?? "clusters";

    return (
        <div className="flex w-full flex-col gap-5">
            <AuthoringBreadcrumb contestId={contest.id} items={[{ label: problem.title }]} />
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-2">
                    <h2 className="truncate text-2xl font-semibold tracking-tight">
                        {problem.title}
                    </h2>
                    {problem.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {[...problem.tags].sort().map((tag) => (
                                <TagBadge key={tag} tag={tag} />
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link to={`/problem/${problem.id}`}>
                            <ExternalLink />
                            {t("managementProblems.problem.viewPublic")}
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link to="generators">
                            <Wand2 />
                            {t("managementProblems.problem.generators")}
                        </Link>
                    </Button>
                    {canEdit && (
                        <ConfirmDialog
                            trigger={
                                <Button variant="outline" size="sm" className="text-destructive">
                                    <Trash2 />
                                    {t("managementProblems.problem.delete")}
                                </Button>
                            }
                            description={t("managementProblems.list.deleteDescription", {
                                title: problem.title,
                            })}
                            confirmLabel={t("common.delete")}
                            onConfirm={() =>
                                remove.mutateAsync(problem.id).then(() => {
                                    toast.success(t("managementProblems.list.deleted"));
                                    navigate(`/management/${contest.id}/problems`);
                                })
                            }
                        />
                    )}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <StatCard
                    label={t("managementProblems.problem.score")}
                    value={problem.score}
                    icon={Gauge}
                />
                <StatCard
                    label={t("managementProblems.problem.clusters")}
                    value={clusters.length}
                    icon={Layers}
                />
                <StatCard
                    label={t("managementProblems.form.evaluationVariant")}
                    value={
                        <span className="text-lg">
                            {t(`evaluationVariants.${problem.evaluation_variant}`)}
                        </span>
                    }
                    icon={Cpu}
                />
                <StatCard
                    label={t("managementProblems.problem.timeLimit")}
                    value={`${problem.time_limit_millis} ms`}
                    icon={Timer}
                />
                <StatCard
                    label={t("managementProblems.problem.memoryLimit")}
                    value={`${problem.memory_limit_megabytes} MiB`}
                    icon={MemoryStick}
                />
            </div>
            <Tabs
                value={tab}
                onValueChange={(value) => {
                    params.set("tab", value);
                    setParams(params, { replace: true });
                }}
            >
                <TabsList>
                    <TabsTrigger value="clusters">
                        {t("managementProblems.problem.clusters")}
                    </TabsTrigger>
                    <TabsTrigger value="settings">
                        {t("managementProblems.problem.settings")}
                    </TabsTrigger>
                    <TabsTrigger value="submissions">
                        {t("managementProblems.problem.submissions")}
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="clusters">
                    <Section
                        title={t("managementProblems.clusters.title")}
                        icon={Layers}
                        actions={
                            canEdit && (
                                <CreateClusterDialog
                                    problemId={problem.id}
                                    problemTitle={problem.title}
                                />
                            )
                        }
                    >
                        <ClustersTable
                            contestId={contest.id}
                            problemId={problem.id}
                            canEdit={canEdit}
                        />
                    </Section>
                </TabsContent>
                <TabsContent value="settings">
                    <Section title={t("managementProblems.form.editTitle")}>
                        <ProblemForm
                            key={problem.id.toString()}
                            editing
                            defaultValues={problemToValues(problem)}
                            submitLabel={t("managementProblems.form.save")}
                            onSubmit={(values) =>
                                update
                                    .mutateAsync(values)
                                    .then(() => toast.success(t("managementProblems.form.saved")))
                            }
                        />
                    </Section>
                </TabsContent>
                <TabsContent value="submissions">
                    <Section title={t("managementProblems.submissions.title")}>
                        <ProblemSubmissionsTable
                            problemId={problem.id}
                            maxScore={problem.score}
                            canRejudge={canEdit}
                        />
                    </Section>
                </TabsContent>
            </Tabs>
        </div>
    );
};
