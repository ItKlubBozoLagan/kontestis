import { FC } from "react";

import { AdminStatisticsCharts } from "./charts/AdminStatisticsCharts";
import { AdminSystemMetricsCharts } from "./charts/metrics/AdminSystemMetricsCharts";

export const AdminOverviewPage: FC = () => {
    return (
        <div tw={"w-full flex flex-col gap-8"}>
            <AdminSystemMetricsCharts />
            <AdminStatisticsCharts />
        </div>
    );
};
