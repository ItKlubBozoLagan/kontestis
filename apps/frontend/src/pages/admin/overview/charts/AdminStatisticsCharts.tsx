import { FC, useEffect } from "react";

import { LoadingSpinner } from "../../../../components/LoadingSpinner";
import { useGrafanaSession } from "../../../../hooks/stats/useGrafanaSession";
import { useTranslation } from "../../../../hooks/useTranslation";

export const AdminStatisticsCharts: FC = () => {
    const { t } = useTranslation();
    const session = useGrafanaSession();
    const { mutate } = session;

    useEffect(() => {
        mutate();
    }, [mutate]);

    if (session.isLoading)
        return (
            <div tw={"w-full h-64 flex items-center justify-center"}>
                <LoadingSpinner size={"lg"} />
            </div>
        );

    if (!session.data)
        return (
            <div tw={"w-full h-48 flex items-center justify-center bg-neutral-100"}>
                <span tw={"text-neutral-600"}>{t("admin.overview.charts.unavailable")}</span>
            </div>
        );

    return (
        <iframe
            src={session.data.embedUrl}
            title={t("admin.overview.charts.title")}
            tw={"w-full h-[560px] border-0 bg-neutral-100"}
            referrerPolicy={"no-referrer"}
        />
    );
};
