import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { useTranslation } from "react-i18next";

import { statsQueries } from "@/api/stats";
import { SubmissionActivity } from "@/components/charts/SubmissionActivity";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPercent } from "@/lib/format";

const Summary = () => {
    const { t } = useTranslation();
    const { data, isPending } = useQuery(statsQueries.overview());

    if (isPending || !data) return <Skeleton className="h-5 w-72 max-w-full" />;

    if (data.submissions === 0)
        return (
            <p className="text-muted-foreground text-sm">{t("dashboard.activity.summaryEmpty")}</p>
        );

    return (
        <p className="text-muted-foreground text-sm">
            {t("dashboard.activity.summary", {
                solved: data.solved_problems,
                total: data.problems,
                submissions: data.submissions,
                rate: formatPercent(data.accepted_submissions / data.submissions),
            })}
        </p>
    );
};

/** One summary line above the submission heatmap. */
export const ActivitySection = () => {
    const { t } = useTranslation();

    return (
        <section className="flex flex-col gap-2" aria-labelledby="dashboard-activity">
            <h2 id="dashboard-activity" className="flex items-center gap-2 text-lg font-normal">
                <Activity className="text-muted-foreground size-4" />
                {t("dashboard.activity.title")}
            </h2>
            <Summary />
            <SubmissionActivity />
        </section>
    );
};
