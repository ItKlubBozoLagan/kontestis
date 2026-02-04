import "@/styles/prism-custom.css";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-go";
import "prismjs/components/prism-nasm";
import "prismjs/components/prism-ocaml";

import {
    AdminPermissions,
    ContestMemberPermissions,
    hasAdminPermission,
    hasContestPermission,
} from "@kontestis/models";
import Convert from "ansi-to-html";
import escapeHtml from "escape-html";
import {
    ArrowLeft,
    Check,
    ChevronLeft,
    Code2,
    Copy,
    Download,
    FileCode,
    Timer,
    X,
} from "lucide-react";
// Import Prism core FIRST, then language components
import Prism from "prismjs";
import { useCallback, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

// Initialize Prism
Prism.manual = true;

// ANSI to HTML converter
const ansiConverter = new Convert();

import { Cluster, ClusterSubmission, TestcaseSubmission } from "@kontestis/models";

import { useSelfContestMembers } from "@/api/contest-extras";
import { useContest } from "@/api/contests";
import { useProblem } from "@/api/problems";
import {
    getSubmissionFileUrl,
    useAllClusters,
    useSubmission,
    useSubmissionClusters,
    useSubmissionFiles,
    useSubmissionTestcases,
} from "@/api/submissions";
import { ScoreBadge } from "@/components/score-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/i18n/useTranslation";
import { convertFromBase64 } from "@/lib/base64";
import { downloadFile } from "@/lib/download";
import { useAuthStore } from "@/store/auth";

// Get verdict color class
function getVerdictColor(verdict: string): string {
    if (verdict === "accepted") return "text-green-600";

    if (verdict === "custom") return "text-yellow-600";

    return "text-red-600";
}

export function SubmissionViewPage() {
    const { submissionId } = useParams<{ submissionId: string }>();
    const submissionIdBigInt = useMemo(() => BigInt(submissionId ?? 0), [submissionId]);

    const { data: submission, isLoading: submissionLoading } = useSubmission(submissionIdBigInt);
    const { data: submissionClusters } = useSubmissionClusters(submissionIdBigInt);
    const { data: clusters } = useAllClusters(submission?.problem_id ?? 0n);
    const { data: problem } = useProblem(submission?.problem_id ?? 0n);
    const { data: contest } = useContest(problem?.contest_id ?? 0n);
    const { data: selfMembers } = useSelfContestMembers();
    const { user } = useAuthStore();

    const member = useMemo(() => {
        if (!selfMembers || !contest) return;

        return selfMembers.find((m) => m.contest_id === contest.id);
    }, [selfMembers, contest]);

    const [selectedCluster, setSelectedCluster] = useState<ClusterSubmission | null>(null);
    const [copied, setCopied] = useState(false);
    const { t } = useTranslation();

    // Combine submission clusters with cluster info
    const fullSubmissionClusters = useMemo(() => {
        if (!submissionClusters || !clusters) return [];

        return submissionClusters
            .map((sc) => ({
                ...sc,
                cluster: clusters.find((c) => c.id === sc.cluster_id),
            }))
            .filter((sc) => sc.cluster)
            .sort((a, b) => {
                const orderA = a.cluster?.order_number ?? 0n;
                const orderB = b.cluster?.order_number ?? 0n;

                if (orderA === orderB) {
                    return Number(a.cluster_id - b.cluster_id);
                }

                return Number(orderA - orderB);
            });
    }, [submissionClusters, clusters]);

    const sampleClusters = fullSubmissionClusters.filter((sc) => sc.cluster?.is_sample);
    const regularClusters = fullSubmissionClusters.filter((sc) => !sc.cluster?.is_sample);

    const copyCode = async () => {
        if (submission?.code) {
            await navigator.clipboard.writeText(convertFromBase64(submission.code));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (submissionLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!submission) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <FileCode className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Submission not found</p>
            </div>
        );
    }

    // If viewing testcases for a specific cluster
    if (selectedCluster) {
        return (
            <TestcaseView
                submissionId={submissionIdBigInt}
                clusterSubmission={selectedCluster}
                cluster={clusters?.find((c) => c.id === selectedCluster.cluster_id)}
                contest={contest}
                member={member}
                user={user}
                onBack={() => setSelectedCluster(null)}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to={`/problem/${submission.problem_id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
            </div>

            {/* Source Code */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Code2 className="h-5 w-5" />
                            {t("submissions.individual.sourceCode")}
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={copyCode}>
                            {copied ? (
                                <>
                                    <Check className="h-4 w-4 mr-2 text-green-500" />
                                    {t("submissions.individual.copied")}
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4 mr-2" />
                                    {t("submissions.individual.copyCode")}
                                </>
                            )}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <SyntaxHighlightedCode
                        code={convertFromBase64(submission.code)}
                        language={submission.language}
                    />
                </CardContent>
            </Card>

            {/* Compiler Output */}
            {(submission.compiler_output || submission.verdict === "compilation_error") && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            {submission.verdict === "compilation_error"
                                ? "Compile Time Error"
                                : "Compiler Output"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre
                            className="bg-neutral-100 dark:bg-neutral-900 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap text-red-600 dark:text-red-400"
                            dangerouslySetInnerHTML={{
                                __html: ansiConverter.toHtml(
                                    escapeHtml(
                                        submission.compiler_output ||
                                            (submission.verdict === "compilation_error"
                                                ? (submission as unknown as { error?: string })
                                                      .error || ""
                                                : "")
                                    )
                                ),
                            }}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Sample Clusters */}
            {sampleClusters.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Timer className="h-5 w-5" />
                        {t("submissions.table.head.samples")}
                    </h2>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("submissions.table.head.sample")}</TableHead>
                                    <TableHead>{t("submissions.table.head.verdict")}</TableHead>
                                    <TableHead>{t("submissions.table.head.time")}</TableHead>
                                    <TableHead>{t("submissions.table.head.memory")}</TableHead>
                                    <TableHead className="text-right">
                                        {t("submissions.table.head.points")}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sampleClusters.map((sc, index) => (
                                    <ClusterRow
                                        key={sc.id.toString()}
                                        clusterSubmission={sc}
                                        label={t("submissions.table.body.sampleIndex", index + 1)}
                                        maxScore={sc.cluster?.awarded_score ?? 0}
                                        onClick={() => setSelectedCluster(sc)}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* Regular Clusters */}
            <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Timer className="h-5 w-5" />
                    {t("submissions.individual.clusters")}
                </h2>
                {regularClusters.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6">
                        {t("submissions.empty")}
                    </p>
                ) : (
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("submissions.table.head.cluster")}</TableHead>
                                    <TableHead>{t("submissions.table.head.verdict")}</TableHead>
                                    <TableHead>{t("submissions.table.head.time")}</TableHead>
                                    <TableHead>{t("submissions.table.head.memory")}</TableHead>
                                    <TableHead className="text-right">
                                        {t("submissions.table.head.points")}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {regularClusters.map((sc, index) => (
                                    <ClusterRow
                                        key={sc.id.toString()}
                                        clusterSubmission={sc}
                                        label={t("submissions.table.body.clusterIndex", index + 1)}
                                        maxScore={sc.cluster?.awarded_score ?? 0}
                                        onClick={() => setSelectedCluster(sc)}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
}

interface ClusterRowProperties {
    clusterSubmission: ClusterSubmission & { cluster?: Cluster };
    label: string;
    maxScore: number;
    onClick: () => void;
}

function ClusterRow({ clusterSubmission, label, maxScore, onClick }: ClusterRowProperties) {
    return (
        <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onClick}>
            <TableCell className="font-medium text-primary hover:underline">{label}</TableCell>
            <TableCell className={getVerdictColor(clusterSubmission.verdict)}>
                {clusterSubmission.verdict.replace(/_/g, " ")}
            </TableCell>
            <TableCell>{clusterSubmission.time_used_millis} ms</TableCell>
            <TableCell>{clusterSubmission.memory_used_megabytes.toFixed(2)} MiB</TableCell>
            <TableCell className="text-right">
                <ScoreBadge
                    score={clusterSubmission.awarded_score}
                    maxScore={maxScore}
                    showFraction={false}
                />
            </TableCell>
        </TableRow>
    );
}

interface TestcaseViewProperties {
    submissionId: bigint;
    clusterSubmission: ClusterSubmission;
    cluster?: Cluster;
    contest?: { id: bigint; start_time: Date; duration_seconds: number } | null;
    member?: { contest_id: bigint; contest_permissions: bigint } | null;
    user: { id: bigint; permissions: bigint } | null;
    onBack: () => void;
}

function TestcaseView({
    submissionId,
    clusterSubmission,
    cluster,
    contest,
    member,
    user,
    onBack,
}: TestcaseViewProperties) {
    const { data: testcases, isLoading } = useSubmissionTestcases(clusterSubmission.id);
    const { data: files } = useSubmissionFiles(submissionId, clusterSubmission.cluster_id, {
        enabled: !!cluster,
    });

    const isContestFinished = useMemo(() => {
        if (!contest) return true;

        return contest.start_time.getTime() + contest.duration_seconds * 1000 < Date.now();
    }, [contest]);

    const isSample = cluster?.is_sample ?? false;

    const canViewFiles = useMemo(() => {
        if (isContestFinished || isSample) return true;

        if (user && hasAdminPermission(user.permissions, AdminPermissions.EDIT_CONTEST))
            return true;

        if (
            member &&
            hasContestPermission(member.contest_permissions, ContestMemberPermissions.VIEW_PRIVATE)
        )
            return true;

        return false;
    }, [isContestFinished, isSample, user, member]);

    const downloadSubmissionFile = useCallback(
        async (testcaseId: bigint, type: "in" | "out" | "sout") => {
            try {
                const url = await getSubmissionFileUrl(
                    submissionId,
                    clusterSubmission.cluster_id,
                    testcaseId,
                    type
                );

                await downloadFile(url);
            } catch (error) {
                console.error("Failed to download file:", error);
            }
        },
        [submissionId, clusterSubmission.cluster_id]
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold">
                    {cluster?.is_sample ? "Sample" : "Cluster"} Test Cases
                </h2>
            </div>
            {!testcases || testcases.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">
                    No testcase details available
                </p>
            ) : (
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Testcase</TableHead>
                                <TableHead>Verdict</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Memory</TableHead>
                                <TableHead>Points</TableHead>
                                {canViewFiles && (
                                    <>
                                        <TableHead>Input</TableHead>
                                        <TableHead>Output</TableHead>
                                        <TableHead>Submission</TableHead>
                                    </>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...testcases]
                                .sort((a, b) => Number(a.testcase_id - b.testcase_id))
                                .map((tc, index) => (
                                    <TestcaseRow
                                        key={tc.id.toString()}
                                        testcase={tc}
                                        index={index}
                                        files={files ?? []}
                                        canViewFiles={canViewFiles}
                                        onDownload={downloadSubmissionFile}
                                    />
                                ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}

interface TestcaseRowProperties {
    testcase: TestcaseSubmission;
    index: number;
    files: string[];
    canViewFiles: boolean;
    onDownload: (testcaseId: bigint, type: "in" | "out" | "sout") => void;
}

function TestcaseRow({ testcase, index, files, canViewFiles, onDownload }: TestcaseRowProperties) {
    const hasInput = files.includes(`${testcase.testcase_id}.in`);
    const hasOutput = files.includes(`${testcase.testcase_id}.out`);
    const hasSubmissionOutput = files.includes(`${testcase.testcase_id}.sout`);

    return (
        <TableRow>
            <TableCell className="font-medium">Testcase #{index + 1}</TableCell>
            <TableCell className={getVerdictColor(testcase.verdict)}>
                {testcase.verdict.replace(/_/g, " ")}
            </TableCell>
            <TableCell>{testcase.time_used_millis} ms</TableCell>
            <TableCell>{testcase.memory_used_megabytes?.toFixed(2) ?? "?"} MiB</TableCell>
            <TableCell>{testcase.awarded_score ?? "?"}</TableCell>
            {canViewFiles && (
                <>
                    <TableCell>
                        {hasInput ? (
                            <Download
                                className="h-4 w-4 cursor-pointer hover:text-blue-500 transition-colors"
                                onClick={() => onDownload(testcase.testcase_id, "in")}
                            />
                        ) : (
                            <X className="h-4 w-4 text-muted-foreground" />
                        )}
                    </TableCell>
                    <TableCell>
                        {hasOutput ? (
                            <Download
                                className="h-4 w-4 cursor-pointer hover:text-blue-500 transition-colors"
                                onClick={() => onDownload(testcase.testcase_id, "out")}
                            />
                        ) : (
                            <X className="h-4 w-4 text-muted-foreground" />
                        )}
                    </TableCell>
                    <TableCell>
                        {hasSubmissionOutput ? (
                            <Download
                                className="h-4 w-4 cursor-pointer hover:text-blue-500 transition-colors"
                                onClick={() => onDownload(testcase.testcase_id, "sout")}
                            />
                        ) : (
                            <X className="h-4 w-4 text-muted-foreground" />
                        )}
                    </TableCell>
                </>
            )}
        </TableRow>
    );
}

// Syntax highlighting component
interface SyntaxHighlightedCodeProperties {
    code: string;
    language: string;
}

function SyntaxHighlightedCode({ code, language }: SyntaxHighlightedCodeProperties) {
    const codeReference = useCallback(
        (node: HTMLElement | null) => {
            if (node) {
                Prism.highlightElement(node);
            }
        },
        [code, language]
    );

    // Map language names to Prism language identifiers
    const getPrismLanguage = (lang: string): string => {
        const languageMap: Record<string, string> = {
            gnu_asm_x86_linux: "nasm",
            cpp: "cpp",
            c: "c",
            python: "python",
            java: "java",
            javascript: "javascript",
            rust: "rust",
            go: "go",
            ocaml: "ocaml",
        };

        return languageMap[lang] || lang;
    };

    const prismLanguage = getPrismLanguage(language);

    return (
        <pre className="rounded-lg overflow-x-auto text-sm max-h-[400px] overflow-y-auto">
            <code ref={codeReference} className={`language-${prismLanguage}`}>
                {code}
            </code>
        </pre>
    );
}
