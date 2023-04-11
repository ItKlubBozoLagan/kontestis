import { RawSystemMetrics } from "@kontestis/models";
import { FC, useEffect, useState } from "react";

import { Dataset, HistoryLineChart } from "../../../components/HistoryLineChart";

type Properties = {
    metrics: RawSystemMetrics;
};

type DatasetsState = {
    cpu: Dataset[];
    memory: Dataset[];
};

const generateEmptyDataset = (length: number): Dataset[] =>
    Array.from({ length }, (_, index) => ({ time: new Date(Date.now() - index * 1000), value: 0 }));

export const AdminRawSystemMetricsCharts: FC<Properties> = ({ metrics }) => {
    const [datasets, setDatasets] = useState<DatasetsState>({
        cpu: generateEmptyDataset(40),
        memory: generateEmptyDataset(40),
    });

    useEffect(() => {
        const now = new Date();
        const [cpu, memory] = [
            [metrics.cpus, metrics.cpuUsage / 100],
            [metrics.memoryMegabytes, metrics.memoryUsageMegabytes],
        ].map(([metricMax, metricValue]) => ({
            time: now,
            value: (metricValue / metricMax) * 100,
        }));

        setDatasets(({ cpu: oldCpu, memory: oldMemory }: DatasetsState) => ({
            cpu: [...oldCpu, cpu].slice(-40),
            memory: [...oldMemory, memory].slice(-40),
        }));
    }, [metrics]);

    return (
        <div tw={"w-full flex gap-4"}>
            <HistoryLineChart
                title={"CPU"}
                live
                dataset={datasets.cpu}
                loading={datasets.cpu.length === 0}
                yMin={0}
                yMax={100}
            />
            <HistoryLineChart
                title={"Memory"}
                live
                dataset={datasets.memory}
                loading={datasets.memory.length === 0}
                yMin={0}
                yMax={100}
            />
        </div>
    );
};
