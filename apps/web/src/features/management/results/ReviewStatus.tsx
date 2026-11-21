import type { ExamFinalSubmission } from "@kontestis/models";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

export type ReviewState = "reviewed" | "pending" | "none";

export const reviewState = (submissions: Pick<ExamFinalSubmission, "reviewed">[]): ReviewState =>
    submissions.length === 0
        ? "none"
        : submissions.every((it) => it.reviewed)
        ? "reviewed"
        : "pending";

export const ReviewStatus = ({ state }: { state: ReviewState }) => {
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
            className="border-green-300 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
        >
            {t("management.results.reviewed")}
        </Badge>
    ) : (
        <Badge
            variant="outline"
            className="border-red-300 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
        >
            {t("management.results.notReviewed")}
        </Badge>
    );
};
