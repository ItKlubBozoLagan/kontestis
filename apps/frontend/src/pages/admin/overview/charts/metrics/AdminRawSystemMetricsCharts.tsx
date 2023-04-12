import { RawSystemMetrics } from "@kontestis/models";
import { FC, useEffect, useState } from "react";

import { HistoryLineChart } from "../../../../../components/HistoryLineChart";
import { formatNewUsageDataset, generateEmptyDataset, UsageDatasetsState } from "./datasets";

type Properties = {
    metrics: RawSystemMetrics;
};

export const AdminRawSystemMetricsCharts: FC<Properties> = ({ metrics }) => {
    const [datasets, setDatasets] = useState<UsageDatasetsState>({
        cpu: generateEmptyDataset(40),
        memory: generateEmptyDataset(40),
    });

    useEffect(() => {
        setDatasets((oldDataset) => formatNewUsageDataset(new Date(), oldDataset, metrics, 40));
    }, [metrics]);

    return (
        <div tw={"w-full flex gap-4"}>
            <HistoryLineChart
                title={"CPU"}
                live
                datasets={[datasets.cpu]}
                loading={datasets.cpu.length === 0}
                yMin={0}
                yMax={100}
            />
            <HistoryLineChart
                title={"Memory"}
                live
                datasets={[datasets.memory]}
                loading={datasets.memory.length === 0}
                yMin={0}
                yMax={100}
            />
        </div>
    );
};
