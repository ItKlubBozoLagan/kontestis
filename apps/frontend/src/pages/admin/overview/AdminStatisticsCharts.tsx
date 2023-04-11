import { FC, useState } from "react";

import { HistoryLineChart } from "../../../components/HistoryLineChart";
import { StatisticRange } from "../../../hooks/stats/types";
import { useAdminActivityStat } from "../../../hooks/stats/useAdminActivityStat";
import {
    AdminLoginStatParamaters,
    useAdminLoginsStat,
} from "../../../hooks/stats/useAdminLoginsStat";
import { useFormatCountStat } from "../../../hooks/useFormatCountStat";
import { useTranslation } from "../../../hooks/useTranslation";

export const AdminStatisticsCharts: FC = () => {
    const [activityRange, setActivityRange] = useState<StatisticRange>("24h");
    const [loginParameters, setLoginParameters] = useState<AdminLoginStatParamaters>({
        range: "24h",
        unique: false,
        newLogins: false,
    });

    const { data: activity, isLoading: activityIsLoading } = useAdminActivityStat(
        {
            range: activityRange,
        },
        {
            refetchInterval: 5000,
        }
    );
    const { data: logins, isLoading: loginsIsLoading } = useAdminLoginsStat(loginParameters, {
        refetchInterval: 5000,
    });

    const activityDataset = useFormatCountStat(activity?.stats);

    const loginsDataset = useFormatCountStat(logins?.stats);

    const { t } = useTranslation();

    return (
        <div tw={"flex gap-4"}>
            {activityDataset && (
                <HistoryLineChart
                    title={t("admin.overview.charts.activityLabel")}
                    dark
                    dataset={activityDataset}
                    loading={activityIsLoading}
                    onRangeChange={setActivityRange}
                    activeRange={activityRange}
                    previousPeriodChange={activity?.previousPeriodChange}
                />
            )}
            {loginsDataset && (
                <HistoryLineChart
                    title={t("admin.overview.charts.loginLabel")}
                    dark
                    dataset={loginsDataset}
                    loading={loginsIsLoading}
                    onRangeChange={(range) =>
                        setLoginParameters((parameters) => ({ ...parameters, range }))
                    }
                    activeRange={loginParameters.range}
                    previousPeriodChange={logins?.previousPeriodChange}
                    toggles={[
                        t("admin.overview.charts.loginToggleNewUsers"),
                        t("admin.overview.charts.loginToggleUnique"),
                    ]}
                    onToggleUpdate={(toggle, value) => {
                        if (toggle === t("admin.overview.charts.loginToggleNewUsers"))
                            setLoginParameters((parameters) => ({
                                ...parameters,
                                newLogins: value,
                            }));

                        if (toggle === t("admin.overview.charts.loginToggleUnique"))
                            setLoginParameters((parameters) => ({
                                ...parameters,
                                unique: value,
                            }));
                    }}
                />
            )}
        </div>
    );
};
