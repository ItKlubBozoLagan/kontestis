import { FC } from "react";

import { AdminStatisticsCharts } from "./AdminStatisticsCharts";

export const AdminOverviewPage: FC = () => {
    return (
        <div tw={"w-full flex flex-col gap-4"}>
            <AdminStatisticsCharts />
        </div>
    );
};
