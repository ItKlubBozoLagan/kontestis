import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
    accepted:
        "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
    custom: "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
    wrong_answer:
        "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    time_limit_exceeded:
        "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    memory_limit_exceeded:
        "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    runtime_error:
        "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
    compilation_error:
        "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
    evaluation_error: "bg-neutral-200 text-neutral-800 border-neutral-300",
    system_error: "bg-neutral-200 text-neutral-800 border-neutral-300",
    skipped: "bg-neutral-100 text-neutral-600 border-neutral-300",
    pending: "bg-sky-50 text-sky-700 border-sky-200 animate-pulse",
};

/** Colored submission/testcase verdict. Pass `"pending"` for submissions still evaluating. */
export const VerdictBadge = ({ verdict, className }: { verdict: string; className?: string }) => {
    const { t } = useTranslation();

    return (
        <Badge variant="outline" className={cn("font-mono", styles[verdict], className)}>
            {t(`verdicts.${verdict}`, { defaultValue: verdict.replaceAll("_", " ") })}
        </Badge>
    );
};
