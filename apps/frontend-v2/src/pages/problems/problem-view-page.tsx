import "katex/dist/katex.min.css";

import { formatDistanceToNow } from "date-fns";
import {
    ArrowLeft,
    Award,
    Check,
    ChevronDown,
    ChevronUp,
    Clock,
    Code2,
    Database,
    FileCode,
    FileText,
    Loader2,
    Send,
    X,
} from "lucide-react";
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

import { useProblem, useProblemScore } from "@/api/problems";
import { useProblemSubmissions, useSubmitSubmission } from "@/api/submissions";
import { ScoreBadge } from "@/components/score-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { convertToBase64 } from "@/lib/base64";
import { cn } from "@/lib/utils";

const LANGUAGES = [
    { value: "cpp", label: "C++" },
    { value: "python", label: "Python" },
    { value: "c", label: "C" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
    { value: "java", label: "Java" },
    { value: "ocaml", label: "OCaml" },
    { value: "gnu_asm_x86_linux", label: "GNU Assembly (Linux x86_64)" },
] as const;

export function ProblemViewPage() {
    const { problemId } = useParams<{ problemId: string }>();
    const problemIdBigInt = useMemo(() => BigInt(problemId ?? 0), [problemId]);
    const navigate = useNavigate();
    const location = useLocation();

    // Check if we came from the problems list page
    const cameFromProblemsList = location.state?.from === "problems-list";

    const { data: problem, isLoading: problemLoading } = useProblem(problemIdBigInt);
    const { data: submissions } = useProblemSubmissions(problemIdBigInt);
    const { data: score } = useProblemScore(problemIdBigInt);
    const submitMutation = useSubmitSubmission(problemIdBigInt);
    const { t } = useTranslation();

    const [language, setLanguage] = useState<string>("cpp");
    const [code, setCode] = useState<string>("");
    const [submissionsExpanded, setSubmissionsExpanded] = useState(false);
    const textAreaReference = useRef<HTMLTextAreaElement>(null);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const target = e.target as HTMLTextAreaElement;
            const start = target.selectionStart;
            const end = target.selectionEnd;
            const newValue =
                code.slice(0, Math.max(0, start)) + "\t" + code.slice(Math.max(0, end));

            setCode(newValue);
            // Restore cursor position after tab insert
            setTimeout(() => {
                target.selectionStart = target.selectionEnd = start + 1;
            }, 0);
        }
    };

    const onSubmit = () => {
        if (code.trim().length === 0) return;

        submitMutation.mutate({
            language,
            code: convertToBase64(code),
        });

        // Clear the code box after submission
        setCode("");
    };

    // Sort and limit submissions
    const sortedSubmissions = useMemo(() => {
        return (submissions ?? []).slice().sort((a, b) => Number(BigInt(b.id) - BigInt(a.id)));
    }, [submissions]);

    const displayedSubmissions = submissionsExpanded
        ? sortedSubmissions
        : sortedSubmissions.slice(0, 3);

    if (problemLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!problem) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <FileCode className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Problem not found</p>
            </div>
        );
    }

    const userScore = score ?? 0;

    const handleBack = () => {
        if (cameFromProblemsList) {
            navigate("/problems");
        } else {
            navigate(`/contest/${problem.contest_id}`);
        }
    };

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
            </Button>

            {/* Two Column Layout: Problem Details | Submit Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Problem Details */}
                <Card>
                    <CardContent className="p-4 space-y-4">
                        {/* Problem Title and Score */}
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold flex items-center gap-3">
                                <FileCode className="h-6 w-6" />
                                {problem.title}
                            </h1>
                            <ScoreBadge score={userScore} maxScore={problem.score} />
                        </div>

                        {/* Limits - Single Column */}
                        <div className="space-y-2">
                            <LimitBox
                                icon={<Clock className="h-5 w-5" />}
                                title={t("problems.individual.limits.time")}
                                value={`${problem.time_limit_millis} ms`}
                            />
                            <LimitBox
                                icon={<Database className="h-5 w-5" />}
                                title={t("problems.individual.limits.memory")}
                                value={`${problem.memory_limit_megabytes} MiB`}
                            />
                            <LimitBox
                                icon={<Code2 className="h-5 w-5" />}
                                title={t("problems.individual.limits.sourceSize")}
                                value="64 KiB"
                            />
                            <LimitBox
                                icon={<Award className="h-5 w-5" />}
                                title={t("problems.individual.limits.points")}
                                value={`${problem.score}`}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column: Submit Section */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        {t("problems.individual.submit.title")}
                    </h2>

                    <div className="space-y-3">
                        <textarea
                            ref={textAreaReference}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full min-h-[150px] p-4 font-mono text-sm bg-muted rounded-lg border resize-y"
                            style={{ tabSize: 4 }}
                            placeholder="Paste your code here..."
                        />

                        <div className="flex items-center gap-4">
                            {problem.evaluation_variant !== "output-only" && (
                                <div className="flex items-center gap-2">
                                    <Label>{t("submissions.table.head.language")}:</Label>
                                    <Select value={language} onValueChange={setLanguage}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Select language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LANGUAGES.map((lang) => (
                                                <SelectItem key={lang.value} value={lang.value}>
                                                    {lang.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <Button
                                onClick={onSubmit}
                                disabled={submitMutation.isPending || !code.trim()}
                            >
                                {submitMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {t("problems.individual.submit.submitButton")}...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-2" />
                                        {t("problems.individual.submit.submitButton")}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Submissions Table */}
            <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t("problems.individual.submissions")}
                </h2>

                {sortedSubmissions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6">
                        {t("submissions.empty")}
                    </p>
                ) : (
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("submissions.table.head.verdict")}</TableHead>
                                    <TableHead className="text-center">
                                        {t("submissions.table.head.samples")}
                                    </TableHead>
                                    <TableHead>{t("submissions.table.head.time")}</TableHead>
                                    <TableHead>{t("submissions.table.head.memory")}</TableHead>
                                    <TableHead>{t("submissions.table.head.language")}</TableHead>
                                    <TableHead>{t("submissions.table.head.points")}</TableHead>
                                    <TableHead>{t("submissions.table.head.submitted")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayedSubmissions.map((submission, index) => (
                                    <SubmissionRow
                                        key={submission.id.toString()}
                                        submission={submission}
                                        maxScore={problem.score}
                                        isEven={index % 2 === 0}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                        {sortedSubmissions.length > 3 && (
                            <Button
                                variant="ghost"
                                className="w-full rounded-none border-t"
                                onClick={() => setSubmissionsExpanded(!submissionsExpanded)}
                            >
                                {submissionsExpanded ? (
                                    <>
                                        <ChevronUp className="h-4 w-4 mr-2" />
                                        {t("submissions.table.overflow.collapse")}
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="h-4 w-4 mr-2" />
                                        {t("submissions.table.overflow.expand")} (
                                        {sortedSubmissions.length})
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Problem Description */}
            <Card>
                <CardContent className="p-4 space-y-3">
                    <h2 className="text-lg font-semibold">
                        {t("problems.individual.description")}
                    </h2>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {problem.description ?? "No description available."}
                        </ReactMarkdown>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

interface LimitBoxProperties {
    icon: React.ReactNode;
    title: string;
    value: string;
}

function LimitBox({ icon, title, value }: LimitBoxProperties) {
    return (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="text-muted-foreground">{icon}</div>
            <div>
                <p className="text-xs text-muted-foreground">{title}</p>
                <p className="font-medium">{value}</p>
            </div>
        </div>
    );
}

// Get verdict color class
function getVerdictColor(verdict: string): string {
    if (verdict === "accepted" || verdict === "ACCEPTED") return "text-green-600";

    if (verdict === "custom" || verdict === "CUSTOM") return "text-yellow-600";

    return "text-red-600";
}

interface SubmissionRowProperties {
    submission: {
        id: bigint;
        language: string;
        verdict?: string;
        created_at: Date;
        time_used_millis?: number;
        memory_used_megabytes?: number;
        awarded_score?: number;
        completed?: boolean;
        samples_passed?: boolean;
    };
    maxScore: number;
    isEven?: boolean;
}

function SubmissionRow({ submission, maxScore, isEven }: SubmissionRowProperties) {
    const [dots, setDots] = useState("");
    const isCompleted = !("completed" in submission) || submission.completed !== false;

    // Animated dots for processing indicator
    useEffect(() => {
        if (isCompleted) return;

        const interval = setInterval(() => {
            setDots((d) => {
                if (d === "...") return "";

                return d + ".";
            });
        }, 400);

        return () => clearInterval(interval);
    }, [isCompleted]);

    // Processing submission - show loading state
    if (!isCompleted) {
        return (
            <TableRow className={isEven ? "bg-muted/30" : ""}>
                <TableCell colSpan={7}>
                    <div className="flex items-center justify-center gap-2 text-yellow-600 py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="font-medium">Processing{dots.padEnd(3, "\u00A0")}</span>
                    </div>
                </TableCell>
            </TableRow>
        );
    }

    const awardedScore = submission.awarded_score ?? 0;
    const verdictDisplay = (submission.verdict ?? "unknown").replace(/_/g, " ");

    return (
        <TableRow className={isEven ? "bg-muted/30" : ""}>
            <TableCell>
                <Link
                    to={`/submission/${submission.id}`}
                    className={cn(
                        "font-medium capitalize hover:underline cursor-pointer",
                        getVerdictColor(submission.verdict ?? "")
                    )}
                >
                    {verdictDisplay}
                </Link>
            </TableCell>
            <TableCell className="text-center">
                {submission.samples_passed === undefined ? (
                    <span className="text-muted-foreground">-</span>
                ) : submission.samples_passed ? (
                    <Check className="h-4 w-4 text-green-500 mx-auto" />
                ) : (
                    <X className="h-4 w-4 text-red-500 mx-auto" />
                )}
            </TableCell>
            <TableCell>
                {submission.time_used_millis !== undefined
                    ? `${submission.time_used_millis} ms`
                    : "-"}
            </TableCell>
            <TableCell>
                {submission.memory_used_megabytes !== undefined
                    ? `${submission.memory_used_megabytes.toFixed(2)} MiB`
                    : "-"}
            </TableCell>
            <TableCell>{submission.language}</TableCell>
            <TableCell>
                <ScoreBadge score={awardedScore} maxScore={maxScore} />
            </TableCell>
            <TableCell>
                {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}
            </TableCell>
        </TableRow>
    );
}
