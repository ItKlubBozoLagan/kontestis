import { FC } from "react";

import { AdminStatisticsCharts } from "./AdminStatisticsCharts";
import { AdminSystemMetricsCharts } from "./AdminSystemMetricsCharts";

export const AdminOverviewPage: FC = () => {
    return (
        <div tw={"w-full flex flex-col gap-8"}>
            <AdminSystemMetricsCharts />
            <AdminStatisticsCharts />
        </div>
    );
};
