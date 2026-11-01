import type { GeneratorState } from "@kontestis/models";
import { CheckCircle2, ChevronDown, Clock, Layers, XCircle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const styles: Record<GeneratorState, string> = {
    ready: "border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200",
    pending:
        "border-yellow-300 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
    "not-ready":
        "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
    "generator-error":
        "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
    "validation-error":
        "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
    "solution-error":
        "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
};

const icon = (state: GeneratorState) =>
    state === "ready"
        ? CheckCircle2
        : state === "pending"
        ? Clock
        : state === "not-ready"
        ? Layers
        : XCircle;

export const GeneratorStateBadge = ({
    state,
    className,
}: {
    state: GeneratorState;
    className?: string;
}) => {
    const { t } = useTranslation();
    const Icon = icon(state);

    return (
        <Badge variant="outline" className={cn(styles[state] ?? styles["not-ready"], className)}>
            <Icon className={cn(state === "pending" && "animate-spin")} />
            {t(`managementProblems.status.${state}`, { defaultValue: state })}
        </Badge>
    );
};

// eslint-disable-next-line no-control-regex
const stripAnsi = (text: string) => text.replace(/\u001B\[[\d;]*[A-Za-z]/g, "");

/** First line of a generator/solution error, with the remaining output collapsible. */
export const GenerationError = ({ error }: { error: string }) => {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);
    const [summary, ...rest] = stripAnsi(error).split("\n");
    const details = rest.join("\n").trim();

    return (
        <div className="flex flex-col gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
            <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold tracking-wide uppercase">
                        {t("managementProblems.status.errorDetails")}
                    </span>
                    <span className="text-sm break-words">{summary}</span>
                </div>
                {details && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => setExpanded((value) => !value)}
                        className="shrink-0"
                    >
                        <ChevronDown
                            className={cn("transition-transform", expanded && "rotate-180")}
                        />
                        {expanded
                            ? t("managementProblems.status.hideDetails")
                            : t("managementProblems.status.showDetails")}
                    </Button>
                )}
            </div>
            {details && expanded && (
                <pre className="max-h-80 overflow-auto rounded bg-red-100 p-2 font-mono text-xs whitespace-pre-wrap dark:bg-red-900/40">
                    {details}
                </pre>
            )}
        </div>
    );
};
