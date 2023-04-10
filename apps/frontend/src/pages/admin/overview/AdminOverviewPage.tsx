import { FC, useState } from "react";

import { HistoryLineChart } from "../../../components/HistoryLineChart";
import { CountStatRange } from "../../../hooks/stats/types";
import { useAdminActivityStat } from "../../../hooks/stats/useAdminActivityStat";
import { useAdminLoginsStat } from "../../../hooks/stats/useAdminLoginsStat";
import { useFormatCountStat } from "../../../hooks/useFormatCountStat";
import { RangeFormatters } from "../../../util/charts";

export const AdminOverviewPage: FC = () => {
    const [activityRange, setActivityRange] = useState<CountStatRange>("24h");
    const [loginsRange, setLoginsRange] = useState<CountStatRange>("24h");
    const [uniqueLogins, setUniqueLogins] = useState(false);

    const { data: activity, isLoading: activityIsLoading } = useAdminActivityStat({
        range: activityRange,
    });
    const { data: logins, isLoading: loginsIsLoading } = useAdminLoginsStat({
        range: loginsRange,
        unique: uniqueLogins,
    });

    const activityDataset = useFormatCountStat(activity);

    const loginsDataset = useFormatCountStat(logins);

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
                        onRangeChange={setLoginsRange}
                        dateFormatter={RangeFormatters[loginsRange]}
                        toggles={["unique"]}
                        onToggleUpdate={(_, value) => setUniqueLogins(value)}
                    />
                )}
            </div>
        </div>
    );
};
