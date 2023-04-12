import { KubernetesSystemMetrics } from "@kontestis/models";
import { FC, useEffect, useState } from "react";

import { Dataset, HistoryLineChart } from "../../../../../../components/HistoryLineChart";
import { formatNewUsageDataset, generateEmptyDataset } from "../datasets";
import { MetricsInfoBox } from "./MetricsInfoBox";
import { NodesBox } from "./NodesBox";
import { PodsBox } from "./PodsBox";

type Properties = {
    metrics: KubernetesSystemMetrics;
};

type DatasetsState = {
    cpu: Dataset[];
    memory: Dataset[];
};

export const AdminKubernetesSystemMetricsCharts: FC<Properties> = ({ metrics }) => {
    const [datasets, setDatasets] = useState<DatasetsState>({
        cpu: generateEmptyDataset(40),
        memory: generateEmptyDataset(40),
    });

    const [kontestisDatasets, setKontestisDatasets] = useState<DatasetsState>({
        cpu: generateEmptyDataset(40),
        memory: generateEmptyDataset(40),
    });

    useEffect(() => {
        const now = new Date();

        const podData = metrics.kubeData.pods.reduce(
            (accumulator, current) => ({
                cpuUsage: accumulator.cpuUsage + current.cpuUsage,
                memoryUsageMegabytes:
                    accumulator.memoryUsageMegabytes + current.memoryUsageMegabytes,
            }),
            {
                cpuUsage: 0,
                memoryUsageMegabytes: 0,
            }
        );

        setDatasets((oldDataset) => formatNewUsageDataset(now, oldDataset, metrics, 40));
        setKontestisDatasets((oldDataset) =>
            formatNewUsageDataset(
                now,
                oldDataset,
                {
                    cpus: metrics.cpus,
                    cpuUsage: podData.cpuUsage,
                    memoryMegabytes: metrics.memoryMegabytes,
                    memoryUsageMegabytes: podData.memoryUsageMegabytes,
                },
                40
            )
        );
    }, [metrics]);

    return (
        <div tw={"flex flex-col gap-4"}>
            <div tw={"grid grid-cols-4 gap-4"}>
                <PodsBox kubeData={metrics.kubeData} />
                <NodesBox kubeData={metrics.kubeData} />
                <MetricsInfoBox title={"CPU"}>
                    <div tw={"flex gap-2 justify-between text-base"}>
                        <span tw={"font-bold"}>CPUs - {metrics.cpus}</span>
                        <span tw={"font-mono"}>
                            {(metrics.cpuUsage / metrics.cpus).toFixed(2)}%
                        </span>
                    </div>
                </MetricsInfoBox>
                <MetricsInfoBox title={"Memory"}>
                    <div tw={"flex gap-2 justify-between text-base"}>
                        <span tw={"font-bold"}>Memory - {metrics.memoryMegabytes >> 10} GiB</span>
                        <span tw={"font-mono"}>
                            {(
                                (metrics.memoryUsageMegabytes / metrics.memoryMegabytes) *
                                100
                            ).toFixed(2)}
                            %
                        </span>
                    </div>
                </MetricsInfoBox>
            </div>
            <div tw={"flex flex gap-4"}>
                <HistoryLineChart
                    title={"CPU"}
                    live
                    datasets={[datasets.cpu, kontestisDatasets.memory]}
                    datasetLabels={["Cluster", "Kontestis"]}
                    loading={datasets.cpu.length === 0 || datasets.cpu.length === 3}
                    yMin={0}
                    yMax={100}
                />
                <HistoryLineChart
                    title={"Memory"}
                    live
                    datasets={[datasets.memory, kontestisDatasets.memory]}
                    datasetLabels={["Cluster", "Kontestis"]}
                    loading={datasets.memory.length === 0 || kontestisDatasets.memory.length === 0}
                    yMin={0}
                    yMax={100}
                />
            </div>
        </div>
    );
};
