import type { EvaluationLanguage } from "@kontestis/models";
import { useSuspenseQuery } from "@tanstack/react-query";
import AnsiToHtml from "ansi-to-html";
import { ArrowLeft, ClipboardCheck, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

import { problemQueries } from "@/api/problems";
import { submissionQueries, useReviewFinalSubmission } from "@/api/submissions";
import { ScoreBadge } from "@/components/badges/ScoreBadge";
import { VerdictBadge } from "@/components/badges/VerdictBadge";
import { CodeEditor } from "@/components/code/CodeEditor";
import { CopyButton } from "@/components/common/CopyButton";
import { PageHeader } from "@/components/common/PageHeader";
import { Section } from "@/components/common/Section";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { decodeBase64 } from "@/lib/base64";

const ansi = new AnsiToHtml({ escapeXML: true, newline: true });

const ReviewForm = ({
    finalSubmissionId,
    initialScore,
    initialReviewed,
    evaluatedScore,
    maxScore,
}: {
    finalSubmissionId: bigint;
    initialScore: number;
    initialReviewed: boolean;
    evaluatedScore: number;
    maxScore: number;
}) => {
    const { t } = useTranslation();
    const review = useReviewFinalSubmission();
    const [score, setScore] = useState(String(initialScore));
    const [reviewed, setReviewed] = useState(initialReviewed);

    const valid = score.trim() !== "" && Number.isFinite(Number(score)) && Number(score) >= 0;

    return (
        <Section title={t("management.review.title")} icon={ClipboardCheck} className="h-fit">
            <form
                className="flex flex-col gap-4"
                onSubmit={(event) => {
                    event.preventDefault();

                    if (!valid) return;

                    review.mutate(
                        { finalSubmissionId, final_score: Number(score), reviewed },
                        { onSuccess: () => toast.success(t("management.review.saved")) }
                    );
                }}
            >
                <div className="flex flex-col gap-2">
                    <Label htmlFor="final-score">{t("management.review.score")}</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            id="final-score"
                            type="number"
                            min={0}
                            max={maxScore}
                            value={score}
                            onChange={(event) => setScore(event.target.value)}
                            className="w-28 font-mono"
                        />
                        <span className="text-muted-foreground font-mono text-sm">
                            / {maxScore}
                        </span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                        {t("management.review.scoreHint", { score: evaluatedScore })}
                    </p>
                </div>
                <Label className="flex items-center gap-2 font-normal">
                    <Checkbox
                        checked={reviewed}
                        onCheckedChange={(checked) => setReviewed(checked === true)}
                    />
                    {t("management.review.reviewed")}
                </Label>
                <Button type="submit" disabled={!valid || review.isPending}>
                    {t("management.review.save")}
                </Button>
            </form>
        </Section>
    );
};

export const FinalSubmissionReviewPage = () => {
    const { t } = useTranslation();
    const { finalSubmissionId = "0" } = useParams<{ finalSubmissionId: string }>();
    const { data: finalSubmission } = useSuspenseQuery(submissionQueries.final(finalSubmissionId));
    const { data: submission } = useSuspenseQuery(
        submissionQueries.detail(finalSubmission.submission_id)
    );
    const { data: problem } = useSuspenseQuery(problemQueries.detail(submission.problem_id));

    const code = useMemo(() => decodeBase64(submission.code), [submission.code]);
    const compilerOutput = submission.compiler_output;

    return (
        <div className="flex flex-col gap-6">
            <Button variant="ghost" size="sm" asChild className="w-fit">
                <Link
                    to={`/management/${finalSubmission.contest_id}/results/${finalSubmission.user_id}`}
                >
                    <ArrowLeft />
                    {t("management.results.participant.back")}
                </Link>
            </Button>
            <PageHeader
                title={t("management.review.title")}
                description={
                    <>
                        {t("management.review.problem")}:{" "}
                        <span className="text-foreground font-medium">{problem.title}</span>
                    </>
                }
                actions={
                    <Button variant="outline" size="sm" asChild>
                        <Link to={`/submission/${submission.id}`}>
                            <ExternalLink />
                            {t("management.review.openSubmission")}
                        </Link>
                    </Button>
                }
            />
            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
                <div className="flex min-w-0 flex-col gap-6">
                    <Section
                        title={t("management.review.code")}
                        actions={<CopyButton value={code} />}
                        contentClassName="flex flex-col gap-3"
                    >
                        <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
                            <span>
                                {t("management.review.language")}:{" "}
                                <span className="text-foreground font-medium">
                                    {t(
                                        `programmingLanguages.${submission.language}` as "programmingLanguages.cpp",
                                        {
                                            defaultValue: submission.language,
                                        }
                                    )}
                                </span>
                            </span>
                            <VerdictBadge verdict={submission.verdict} />
                            <ScoreBadge score={submission.awarded_score} max={problem.score} />
                        </div>
                        <CodeEditor
                            value={code}
                            language={submission.language as EvaluationLanguage}
                            readOnly
                            minHeight="80px"
                        />
                    </Section>
                    {compilerOutput && (
                        <Section title={t("management.review.compilerOutput")}>
                            <pre
                                className="bg-muted max-h-80 overflow-auto rounded-md border p-3 font-mono text-xs"
                                dangerouslySetInnerHTML={{ __html: ansi.toHtml(compilerOutput) }}
                            />
                        </Section>
                    )}
                </div>
                <ReviewForm
                    key={`${finalSubmission.final_score}-${finalSubmission.reviewed}`}
                    finalSubmissionId={finalSubmission.id}
                    initialScore={finalSubmission.final_score}
                    initialReviewed={finalSubmission.reviewed}
                    evaluatedScore={submission.awarded_score}
                    maxScore={problem.score}
                />
            </div>
        </div>
    );
};
