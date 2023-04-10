import { FC, useState } from "react";

import { HistoryLineChart } from "../../../components/HistoryLineChart";
import { CountStatRange } from "../../../hooks/stats/types";
import { useAdminActivityStat } from "../../../hooks/stats/useAdminActivityStat";
import {
    AdminLoginStatParamaters,
    useAdminLoginsStat,
} from "../../../hooks/stats/useAdminLoginsStat";
import { useFormatCountStat } from "../../../hooks/useFormatCountStat";
import { useTranslation } from "../../../hooks/useTranslation";
import { RangeFormatters } from "../../../util/charts";

export const AdminOverviewPage: FC = () => {
    const [activityRange, setActivityRange] = useState<CountStatRange>("24h");
    const [loginParameters, setLoginParameters] = useState<AdminLoginStatParamaters>({
        range: "24h",
        unique: false,
        newLogins: false,
    });

    const { data: activity, isLoading: activityIsLoading } = useAdminActivityStat({
        range: activityRange,
    });
    const { data: logins, isLoading: loginsIsLoading } = useAdminLoginsStat(loginParameters);

    const activityDataset = useFormatCountStat(activity);

    const loginsDataset = useFormatCountStat(logins);

    const { t } = useTranslation();

    return (
        <div tw={"w-full flex flex-col gap-4"}>
            <div tw={"flex gap-4"}>
                {activityDataset && (
                    <HistoryLineChart
                        title={"Activity"}
                        dataset={activityDataset}
                        loading={activityIsLoading}
                        onRangeChange={setActivityRange}
                        dateFormatter={RangeFormatters[activityRange]}
                    />
                )}
                {loginsDataset && (
                    <HistoryLineChart
                        title={"Logins"}
                        dataset={loginsDataset}
                        loading={loginsIsLoading}
                        onRangeChange={(range) =>
                            setLoginParameters((parameters) => ({ ...parameters, range }))
                        }
                        dateFormatter={RangeFormatters[loginParameters.range]}
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
        </div>
    );
};
