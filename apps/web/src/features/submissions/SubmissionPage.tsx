import { useSuspenseQuery } from "@tanstack/react-query";
import Convert from "ansi-to-html";
import {
    ArrowLeft,
    Check,
    Clock,
    Database,
    Download,
    FileCode,
    RotateCcw,
    Trophy,
    X,
} from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

import { contestQueries, saveBlob } from "@/api/contests";
import { problemQueries } from "@/api/problems";
import { submissionQueries, useReevaluateSubmission } from "@/api/submissions";
import { ScoreBadge } from "@/components/badges/ScoreBadge";
import { VerdictBadge } from "@/components/badges/VerdictBadge";
import { CodeEditor } from "@/components/code/CodeEditor";
import { FILE_EXTENSIONS } from "@/components/code/languages";
import { CopyButton } from "@/components/common/CopyButton";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Section } from "@/components/common/Section";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { ClusterResults } from "@/features/submissions/ClusterResults";
import { useContestAccess } from "@/hooks/useContestAccess";
import { useNow } from "@/hooks/useNow";
import { decodeBase64 } from "@/lib/base64";
import { contestPhase } from "@/lib/contest";
import { formatDateTime } from "@/lib/format";
import { snowflakeTime } from "@/lib/snowflake";

const ansi = new Convert({ escapeXML: true, newline: false });

export const SubmissionPage = () => {
    const { t } = useTranslation();
    const { submissionId = "0" } = useParams();
    const now = useNow();
    const { data: submission } = useSuspenseQuery(submissionQueries.detail(submissionId));
    const { data: details } = useSuspenseQuery(submissionQueries.details(submissionId));
    const { data: problem } = useSuspenseQuery(problemQueries.detail(submission.problem_id));
    const { data: contest } = useSuspenseQuery(contestQueries.detail(problem.contest_id));
    const access = useContestAccess(contest);
    const reevaluate = useReevaluateSubmission();

    const code = useMemo(() => decodeBase64(submission.code), [submission.code]);
    const compilerOutput =
        submission.compiler_output ||
        (submission.verdict === "compilation_error" && "error" in submission
            ? submission.error
            : "");

    const samples = details.filter((it) => it.is_sample);
    const clusters = details.filter((it) => !it.is_sample);
    const canSeeFiles = contestPhase(contest, now) === "finished" || access.canViewPrivate;
    const extension = FILE_EXTENSIONS[submission.language]?.[0] ?? "txt";

    return (
        <>
            <Link
                to={`/problem/${problem.id}`}
                className="text-muted-foreground hover:text-primary -mb-3 flex w-fit items-center gap-1.5 text-sm"
            >
                <ArrowLeft className="size-4" />
                {problem.title}
            </Link>
            <PageHeader
                title={
                    <span className="flex items-center gap-3">
                        {t("submissions.title", { id: submission.id.toString() })}
                        <VerdictBadge verdict={submission.verdict} className="text-sm" />
                    </span>
                }
                description={`${contest.name} · ${formatDateTime(snowflakeTime(submission.id))}`}
                actions={
                    access.canEdit && (
                        <Button
                            variant="outline"
                            disabled={reevaluate.isPending}
                            onClick={() =>
                                reevaluate.mutate(submission.id, {
                                    onSuccess: () =>
                                        toast.success(t("submissions.view.reevaluating")),
                                })
                            }
                        >
                            <RotateCcw />
                            {t("submissions.view.reevaluate")}
                        </Button>
                    )
                }
            />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <StatCard
                    label={t("submissions.table.points")}
                    icon={Trophy}
                    value={
                        <ScoreBadge
                            score={submission.awarded_score}
                            max={problem.score}
                            className="text-2xl"
                        />
                    }
                />
                <StatCard
                    label={t("submissions.table.time")}
                    icon={Clock}
                    value={`${submission.time_used_millis} ms`}
                />
                <StatCard
                    label={t("submissions.table.memory")}
                    icon={Database}
                    value={`${submission.memory_used_megabytes} MiB`}
                />
                <StatCard
                    label={t("submissions.table.language")}
                    icon={FileCode}
                    value={
                        <span className="text-lg">
                            {t(`programmingLanguages.${submission.language}`)}
                        </span>
                    }
                />
                <StatCard
                    label={t("submissions.table.samples")}
                    icon={submission.samples_passed === false ? X : Check}
                    value={
                        <span className="text-lg">
                            {submission.samples_passed === undefined ||
                            submission.samples_passed === null
                                ? "–"
                                : submission.samples_passed
                                ? t("submissions.view.samplesPassed")
                                : t("submissions.view.samplesFailed")}
                        </span>
                    }
                />
            </div>
            {compilerOutput && (
                <Section
                    title={
                        submission.verdict === "compilation_error"
                            ? t("submissions.view.compileError")
                            : t("submissions.view.compilerOutput")
                    }
                >
                    <pre
                        className="bg-muted max-h-96 overflow-auto rounded-md p-3 font-mono text-xs whitespace-pre"
                        dangerouslySetInnerHTML={{ __html: ansi.toHtml(compilerOutput) }}
                    />
                </Section>
            )}
            {details.length === 0 ? (
                <EmptyState title={t("submissions.view.noResults")} className="rounded-md border" />
            ) : (
                <>
                    {samples.length > 0 && (
                        <ClusterResults
                            title={t("submissions.view.samples")}
                            clusters={samples}
                            submissionId={submission.id}
                            canSeeFiles={canSeeFiles}
                        />
                    )}
                    {clusters.length > 0 && (
                        <ClusterResults
                            title={t("submissions.view.clusters")}
                            clusters={clusters}
                            submissionId={submission.id}
                            canSeeFiles={canSeeFiles}
                        />
                    )}
                    {!canSeeFiles && (
                        <p className="text-muted-foreground -mt-3 text-xs">
                            {t("submissions.view.hiddenFiles")}
                        </p>
                    )}
                </>
            )}
            <Section
                title={t("submissions.view.code")}
                actions={
                    <>
                        <CopyButton value={code} />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                saveBlob(
                                    new Blob([code], { type: "text/plain" }),
                                    `submission-${submission.id}.${extension}`
                                )
                            }
                        >
                            <Download />
                            {t("submissions.view.downloadCode")}
                        </Button>
                    </>
                }
            >
                <CodeEditor
                    value={code}
                    readOnly
                    language={submission.language === "output-only" ? "plain" : submission.language}
                    minHeight="120px"
                    maxHeight="none"
                />
            </Section>
        </>
    );
};
