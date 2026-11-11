import type { ExamFinalSubmission } from "@kontestis/models";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

export type ReviewState = "reviewed" | "pending" | "none";

export const reviewState = (submissions: Pick<ExamFinalSubmission, "reviewed">[]): ReviewState =>
    submissions.length === 0
        ? "none"
        : submissions.every((it) => it.reviewed)
        ? "reviewed"
        : "pending";

/**
 * Review progress of one participant (or one task). With `total` the pending badge says how many
 * of the final submissions are already reviewed, so staff see what is left at a glance.
 */
export const ReviewStatus = ({
    state,
    reviewed,
    total,
}: {
    state: ReviewState;
    reviewed?: number;
    total?: number;
}) => {
    const { t } = useTranslation();

    if (state === "none")
        return (
            <span className="text-muted-foreground font-sans text-sm">
                {t("management.results.noSubmissions")}
            </span>
        );

    return state === "reviewed" ? (
        <Badge
            variant="outline"
            className="gap-1 border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
        >
            <CheckCircle2 className="size-3" />
            {t("management.results.reviewed")}
        </Badge>
    ) : (
        <Badge
            variant="outline"
            className="gap-1 border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
        >
            <CircleDashed className="size-3" />
            {total !== undefined && total > 1
                ? t("management.results.partlyReviewed", { reviewed: reviewed ?? 0, total })
                : t("management.results.notReviewed")}
        </Badge>
    );
};
