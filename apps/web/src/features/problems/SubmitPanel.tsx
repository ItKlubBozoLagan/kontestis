import type { Contest, EvaluationLanguage } from "@kontestis/models";
import { useQuery } from "@tanstack/react-query";
import { FileUp, Send, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "sonner";

import type { VisibleProblem } from "@/api/problems";
import { submissionQueries, useSubmitSolution } from "@/api/submissions";
import { VerdictBadge } from "@/components/badges/VerdictBadge";
import { CodeEditor } from "@/components/code/CodeEditor";
import { languageFromFilename, SUBMISSION_LANGUAGES } from "@/components/code/languages";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { encodeBase64 } from "@/features/submissions/base64";
import { useNow } from "@/hooks/useNow";
import { contestPhase } from "@/lib/contest";

const SOURCE_LIMIT = 64_000;

type Draft = { language: EvaluationLanguage; code: string };

const draftKey = (problemId: bigint) => `@kontestis/web/draft/${problemId}`;

const readDraft = (problemId: bigint): Draft | null => {
    try {
        const raw = localStorage.getItem(draftKey(problemId));

        return raw ? (JSON.parse(raw) as Draft) : null;
    } catch {
        return null;
    }
};

const LAST_LANGUAGE_KEY = "@kontestis/web/last-language";

export const SubmitPanel = ({
    problem,
    contest,
}: {
    problem: VisibleProblem;
    contest: Contest;
}) => {
    const { t } = useTranslation();
    const now = useNow();
    const outputOnly = problem.evaluation_variant === "output-only";
    const fileInput = useRef<HTMLInputElement>(null);
    const submit = useSubmitSolution(problem.id);
    const { data: submissions } = useQuery(submissionQueries.byProblem(problem.id));
    const latest = [...(submissions ?? [])].sort((a, b) => (b.id > a.id ? 1 : -1)).slice(0, 3);

    const [draft, setDraft] = useState<Draft>(() => {
        const saved = readDraft(problem.id);

        if (outputOnly) return { language: "output-only", code: saved?.code ?? "" };

        return (
            saved ?? {
                language:
                    (localStorage.getItem(LAST_LANGUAGE_KEY) as EvaluationLanguage | null) ?? "cpp",
                code: "",
            }
        );
    });

    // persist the draft so a refresh or navigation doesn't lose code
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (draft.code.length === 0) localStorage.removeItem(draftKey(problem.id));
            else localStorage.setItem(draftKey(problem.id), JSON.stringify(draft));
        }, 300);

        return () => clearTimeout(timeout);
    }, [draft, problem.id]);

    const phase = contestPhase(contest, now);

    const doSubmit = () => {
        if (draft.code.trim().length === 0)
            return toast.error(t("problems.individual.submit.empty"));

        const encoded = encodeBase64(draft.code);

        if (!outputOnly && encoded.length >= SOURCE_LIMIT)
            return toast.error(t("problems.individual.submit.tooLarge"));

        submit.mutate(
            { language: draft.language, code: encoded },
            {
                onSuccess: () => {
                    toast.success(t("problems.individual.submit.submitted"));
                    setDraft((previous) => ({ ...previous, code: "" }));
                },
            }
        );
    };

    const loadFile = async (file: File) => {
        const content = await file.text();
        const detected = outputOnly ? undefined : languageFromFilename(file.name);

        setDraft((previous) => ({
            language:
                detected && SUBMISSION_LANGUAGES.includes(detected) ? detected : previous.language,
            code: content,
        }));
    };

    return (
        <div
            className="flex flex-col gap-3"
            onKeyDown={(event) => {
                if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                    event.preventDefault();
                    doSubmit();
                }
            }}
        >
            {outputOnly && (
                <Alert variant="info">{t("problems.individual.submit.outputOnlyHint")}</Alert>
            )}
            {phase === "finished" && (
                <Alert variant="warning">{t("problems.individual.submit.finishedHint")}</Alert>
            )}
            {phase === "upcoming" && (
                <Alert variant="warning">{t("problems.individual.submit.upcomingHint")}</Alert>
            )}
            {!outputOnly && (
                <div className="flex flex-col gap-1.5">
                    <Label>{t("problems.individual.submit.language")}</Label>
                    <Select
                        value={draft.language}
                        onValueChange={(language) => {
                            localStorage.setItem(LAST_LANGUAGE_KEY, language);
                            setDraft((previous) => ({
                                ...previous,
                                language: language as EvaluationLanguage,
                            }));
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SUBMISSION_LANGUAGES.map((language) => (
                                <SelectItem key={language} value={language}>
                                    {t(`programmingLanguages.${language}`)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                    <Label>
                        {outputOnly
                            ? t("problems.individual.submit.output")
                            : t("problems.individual.submit.code")}
                    </Label>
                    <div className="flex gap-1">
                        <input
                            ref={fileInput}
                            type="file"
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0];

                                if (file) void loadFile(file);

                                event.target.value = "";
                            }}
                        />
                        <Button
                            size="sm"
                            variant="ghost"
                            type="button"
                            onClick={() => fileInput.current?.click()}
                        >
                            <FileUp />
                            {t("problems.individual.submit.uploadFile")}
                        </Button>
                        {draft.code.length > 0 && (
                            <Button
                                size="sm"
                                variant="ghost"
                                type="button"
                                aria-label={t("problems.individual.submit.clear")}
                                onClick={() => setDraft((previous) => ({ ...previous, code: "" }))}
                            >
                                <Trash2 />
                            </Button>
                        )}
                    </div>
                </div>
                <CodeEditor
                    value={draft.code}
                    onChange={(code) => setDraft((previous) => ({ ...previous, code }))}
                    language={outputOnly ? "plain" : draft.language}
                    minHeight="260px"
                    maxHeight="480px"
                />
            </div>
            <Button
                onClick={doSubmit}
                disabled={submit.isPending}
                title={t("problems.individual.submit.shortcut")}
            >
                <Send />
                {t("problems.individual.submit.submit")}
            </Button>
            {latest.length > 0 && (
                <div className="flex flex-col gap-1.5 border-t pt-3">
                    <span className="text-muted-foreground text-xs font-medium uppercase">
                        {t("problems.individual.submit.latest")}
                    </span>
                    {latest.map((it) =>
                        it.completed ? (
                            <Link
                                key={it.id.toString()}
                                to={`/submission/${it.id}`}
                                className="hover:bg-muted flex items-center justify-between gap-2 rounded px-1.5 py-1 font-mono text-xs"
                            >
                                <VerdictBadge verdict={it.verdict} />
                                <span>
                                    {it.awarded_score}/{problem.score}
                                </span>
                            </Link>
                        ) : (
                            <div key={it.id.toString()} className="px-1.5 py-1">
                                <VerdictBadge verdict="pending" />
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
};
