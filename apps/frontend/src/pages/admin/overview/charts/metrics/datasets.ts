import { BaseSystemMetrics } from "@kontestis/models";

import { Dataset } from "../../../../../components/HistoryLineChart";

export type UsageDatasetsState = {
    cpu: Dataset[];
    memory: Dataset[];
};

export const generateEmptyDataset = (length: number): Dataset[] =>
    Array.from({ length }, (_, index) => ({ time: new Date(Date.now() - index * 1000), value: 0 }));

// time is passed for consistency
//  if we have 2 datasets in the same chart, and we need to update at the same time,
//  the time in the dataset must be exactly the same as in the other dataset
//  see AdminKubernetesSystemMetricsCharts.tsx
export const formatNewUsageDataset = (
    time: Date,
    oldDataset: UsageDatasetsState,
    info: BaseSystemMetrics,
    size: number
): UsageDatasetsState => {
    const [cpu, memory] = [
        [info.cpus, info.cpuUsage / 100],
        [info.memoryMegabytes, info.memoryUsageMegabytes],
    ].map(([metricMax, metricValue]) => ({
        time,
        value: (metricValue / metricMax) * 100,
    }));

    return {
        cpu: [...oldDataset.cpu, cpu].slice(-size),
        memory: [...oldDataset.memory, memory].slice(-size),
    };
};
