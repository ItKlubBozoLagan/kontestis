import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ExternalLink, History, Layers, NotebookPen, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";

import {
    problemQueries,
    useDeleteProblem,
    useUpdateProblem,
    type VisibleProblem,
} from "@/api/problems";
import { TagBadge } from "@/components/badges/TagBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Section } from "@/components/common/Section";
import { Button } from "@/components/ui/button";
import { pollingClusters } from "@/features/management/clusters/clusterQueries";
import { ClustersTable } from "@/features/management/clusters/ClustersTable";
import { CreateClusterDialog } from "@/features/management/clusters/CreateClusterDialog";
import { ProblemForm, problemToValues } from "@/features/management/problems/ProblemForm";
import { ProblemSubmissionsTable } from "@/features/management/problems/ProblemSubmissionsTable";
import { studioView, SUBMISSIONS_VIEW } from "@/features/management/problems/studioPaths";
import { useManagedContest } from "@/features/management/useManagedContest";
import { useContestAccess } from "@/hooks/useContestAccess";

/** "Total score 100 · Clusters 4 · Checker · 1000 ms · 256 MiB" */
const SummaryLine = ({ problem }: { problem: VisibleProblem }) => {
    const { t } = useTranslation();
    const { data: clusters } = useQuery(pollingClusters(problem.id));

    const items: [string, ReactNode][] = [
        [t("managementProblems.problem.score"), problem.score],
        [t("managementProblems.problem.clusters"), clusters?.length ?? "…"],
        [
            t("managementProblems.form.evaluationVariant"),
            t(`evaluationVariants.${problem.evaluation_variant}`),
        ],
        [t("managementProblems.problem.timeLimit"), `${problem.time_limit_millis} ms`],
        [t("managementProblems.problem.memoryLimit"), `${problem.memory_limit_megabytes} MiB`],
    ];

    return (
        <dl className="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            {items.map(([label, value]) => (
                <div key={label} className="flex items-baseline gap-1.5">
                    <dt>{label}</dt>
                    <dd className="text-foreground font-medium tabular-nums">{value}</dd>
                </div>
            ))}
        </dl>
    );
};

const ProblemHeader = ({ problem, canEdit }: { problem: VisibleProblem; canEdit: boolean }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const contest = useManagedContest();
    const remove = useDeleteProblem();

    return (
        <div className="flex flex-col gap-3 border-b pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-2">
                    <h2 className="text-2xl font-semibold tracking-tight break-words">
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
            <SummaryLine problem={problem} />
        </div>
    );
};

const SettingsView = ({ problem, canEdit }: { problem: VisibleProblem; canEdit: boolean }) => {
    const { t } = useTranslation();
    const contest = useManagedContest();
    const update = useUpdateProblem(problem.id);

    return (
        <>
            <Section title={t("managementProblems.form.editTitle")} icon={NotebookPen}>
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
            <Section
                title={t("managementProblems.clusters.title")}
                icon={Layers}
                actions={
                    canEdit && (
                        <CreateClusterDialog problemId={problem.id} problemTitle={problem.title} />
                    )
                }
                contentClassName="flex flex-col gap-3"
            >
                <p className="text-muted-foreground text-sm">
                    {t("managementProblems.studio.clustersHint")}
                </p>
                <ClustersTable contestId={contest.id} problemId={problem.id} canEdit={canEdit} />
            </Section>
        </>
    );
};

/** Root of the problem studio: statement & settings, or `?view=submissions`. */
export const ProblemManagePage = () => {
    const { t } = useTranslation();
    const contest = useManagedContest();
    const { canEdit } = useContestAccess(contest);
    const { problemId = "0" } = useParams<{ problemId: string }>();
    const [params] = useSearchParams();
    const { data: problem } = useSuspenseQuery(problemQueries.detail(problemId));

    const showSubmissions = studioView(params) === SUBMISSIONS_VIEW;

    return (
        <div className="flex w-full flex-col gap-5">
            <ProblemHeader problem={problem} canEdit={canEdit} />
            {showSubmissions ? (
                <Section title={t("managementProblems.submissions.title")} icon={History}>
                    <ProblemSubmissionsTable
                        problemId={problem.id}
                        maxScore={problem.score}
                        canRejudge={canEdit}
                    />
                </Section>
            ) : (
                <SettingsView problem={problem} canEdit={canEdit} />
            )}
        </div>
    );
};
