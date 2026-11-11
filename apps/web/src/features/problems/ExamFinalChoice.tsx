import type { Contest } from "@kontestis/models";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "sonner";

import type { VisibleProblem } from "@/api/problems";
import { submissionQueries, useSetFinalSubmission } from "@/api/submissions";
import { VerdictBadge } from "@/components/badges/VerdictBadge";
import { Alert } from "@/components/common/Alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useExamFinals } from "@/features/contests/examFinals";
import { useNow } from "@/hooks/useNow";
import { contestPhase } from "@/lib/contest";
import { formatDateTime } from "@/lib/format";
import { snowflakeTime } from "@/lib/snowflake";

const SHOWN = 5;

/** Badge for the final submission, or the button that makes a submission final. */
const FinalAction = ({ submissionId, isFinal }: { submissionId: bigint; isFinal: boolean }) => {
    const { t } = useTranslation();
    const setFinal = useSetFinalSubmission();

    if (isFinal)
        return (
            <Badge
                variant="outline"
                className="shrink-0 gap-1 border-sky-400 text-sky-800 dark:border-sky-700 dark:text-sky-200"
            >
                <CheckCircle2 className="size-3" />
                {t("submissions.body.final")}
            </Badge>
        );

    return (
        <Button
            size="sm"
            variant="outline"
            className="h-7 shrink-0"
            disabled={setFinal.isPending}
            onClick={() =>
                setFinal.mutate(submissionId, {
                    onSuccess: () => toast.success(t("submissions.body.finalSet")),
                })
            }
        >
            {t("submissions.body.setFinal")}
        </Button>
    );
};

const FinalSummary = ({
    finalId,
    finalScore,
    max,
    running,
}: {
    finalId: bigint | undefined;
    finalScore: number | undefined;
    max: number;
    running: boolean;
}) => {
    const { t } = useTranslation();

    if (finalId !== undefined)
        return (
            <Alert variant="info" icon={CheckCircle2} title={t("problems.exam.finalTitle")}>
                <span>
                    <Link
                        to={`/submission/${finalId}`}
                        className="font-medium underline underline-offset-2"
                    >
                        {t("submissions.title", { id: finalId.toString() })}
                    </Link>
                    {" · "}
                    <span className="font-mono tabular-nums">
                        {finalScore}/{max}
                    </span>
                </span>
                {running && <span className="text-xs">{t("problems.exam.changeHint")}</span>}
            </Alert>
        );

    return (
        <Alert
            variant={running ? "warning" : "info"}
            icon={AlertTriangle}
            title={t("problems.exam.noFinalTitle")}
        >
            {running ? t("problems.exam.noFinalHint") : t("problems.exam.noFinalOver")}
        </Alert>
    );
};

/**
 * Exam replacement for "latest submissions" under the submit button: which submission is final
 * for this task, and a one-click way to choose it right after it has been evaluated.
 */
export const ExamFinalChoice = ({
    problem,
    contest,
}: {
    problem: VisibleProblem;
    contest: Contest;
}) => {
    const { t } = useTranslation();
    const running = contestPhase(contest, useNow()) === "running";
    const { data: submissions } = useQuery(submissionQueries.byProblem(problem.id));
    const { byProblem } = useExamFinals(contest);
    const final = byProblem.get(problem.id.toString());
    const latest = [...(submissions ?? [])].sort((a, b) => (b.id > a.id ? 1 : -1));

    return (
        <div className="flex flex-col gap-2 border-t pt-3">
            <FinalSummary
                finalId={final?.submission_id}
                finalScore={final?.final_score}
                max={problem.score}
                running={running}
            />
            {latest.length > 0 && (
                <>
                    <span className="text-muted-foreground text-xs font-medium uppercase">
                        {t("problems.individual.submit.latest")}
                    </span>
                    <ul className="flex flex-col gap-1">
                        {latest.slice(0, SHOWN).map((it) => {
                            const isFinal = final?.submission_id === it.id;

                            return (
                                <li
                                    key={it.id.toString()}
                                    className="flex items-center justify-between gap-2 text-xs"
                                >
                                    {it.completed ? (
                                        <Link
                                            to={`/submission/${it.id}`}
                                            className="hover:bg-muted flex min-w-0 flex-1 items-center gap-2 rounded px-1.5 py-1"
                                        >
                                            <VerdictBadge verdict={it.verdict} />
                                            <span className="font-mono tabular-nums">
                                                {it.awarded_score}/{problem.score}
                                            </span>
                                            <span className="text-muted-foreground ml-auto truncate">
                                                {formatDateTime(snowflakeTime(it.id))}
                                            </span>
                                        </Link>
                                    ) : (
                                        <span
                                            className="flex flex-1 items-center gap-2 px-1.5 py-1"
                                            role="status"
                                        >
                                            <VerdictBadge verdict="pending" />
                                            <span className="text-muted-foreground animate-pulse">
                                                {t("problems.individual.submit.evaluating")}
                                            </span>
                                        </span>
                                    )}
                                    {it.completed && (isFinal || running) && (
                                        <FinalAction submissionId={it.id} isFinal={isFinal} />
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                    {latest.length > SHOWN && (
                        <a
                            href="#submissions"
                            className="text-muted-foreground hover:text-primary w-fit text-xs underline underline-offset-2"
                        >
                            {t("problems.individual.submit.allSubmissions")}
                        </a>
                    )}
                </>
            )}
        </div>
    );
};

/** On a submission page of an exam: whether this is the owner's final one, with a way to pick it. */
export const ExamSubmissionFinal = ({
    contest,
    problemId,
    submissionId,
}: {
    contest: Contest;
    problemId: bigint;
    submissionId: bigint;
}) => {
    const { t } = useTranslation();
    const running = contestPhase(contest, useNow()) === "running";
    const { byProblem, isPending } = useExamFinals(contest);
    const final = byProblem.get(problemId.toString());

    if (isPending) return null;

    if (final?.submission_id === submissionId)
        return (
            <Alert variant="info" icon={CheckCircle2}>
                {t("problems.exam.thisIsFinal")}
            </Alert>
        );

    return (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
            <span className="text-muted-foreground">
                {final ? t("problems.exam.otherIsFinal") : t("problems.exam.noFinalTitle")}
            </span>
            {running && <FinalAction submissionId={submissionId} isFinal={false} />}
        </div>
    );
};
