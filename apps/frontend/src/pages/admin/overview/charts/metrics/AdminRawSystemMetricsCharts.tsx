import { RawSystemMetrics } from "@kontestis/models";
import { FC, useEffect, useState } from "react";

import { HistoryLineChart } from "../../../../../components/HistoryLineChart";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { formatNewUsageDataset, generateEmptyDataset, UsageDatasetsState } from "./datasets";
import { MetricsInfoBox } from "./kubernetes/MetricsInfoBox";

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

    const { t } = useTranslation();

    return (
        <div tw={"flex flex-col gap-4"}>
            <div tw={"grid grid-cols-4 gap-4"}>
                <MetricsInfoBox title={"CPU"}>
                    <div tw={"flex gap-2 justify-between text-base"}>
                        <span tw={"font-bold"}>CPUs - {metrics.cpus}</span>
                        <span tw={"font-mono"}>
                            {(metrics.cpuUsage / metrics.cpus).toFixed(2)}%
                        </span>
                    </div>
                </MetricsInfoBox>
                <MetricsInfoBox title={t("admin.overview.metrics.rawSystem.memory")}>
                    <div tw={"flex gap-2 justify-between text-base"}>
                        <span tw={"font-bold"}>
                            {/* not bit-shifting because precision */}
                            {t("admin.overview.metrics.rawSystem.memory")} -{" "}
                            {Math.ceil(metrics.memoryMegabytes / 1024)} GiB
                        </span>
                        <span tw={"font-mono"}>
                            {(
                                (metrics.memoryUsageMegabytes / metrics.memoryMegabytes) *
                                100
                            ).toFixed(2)}
                            %
                        </span>
                    </div>
                </MetricsInfoBox>
                <MetricsInfoBox title={t("admin.overview.metrics.rawSystem.operatingSystem")}>
                    <div tw={"flex gap-2 justify-between text-base"}>
                        <span tw={"font-mono"}>{metrics.osPrettyName}</span>
                    </div>
                </MetricsInfoBox>
                <MetricsInfoBox title={t("admin.overview.metrics.rawSystem.hostname")}>
                    <div tw={"flex gap-2 justify-between text-base"}>
                        <span tw={"font-mono"}>{metrics.hostname}</span>
                    </div>
                </MetricsInfoBox>
            </div>
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
                    title={t("admin.overview.metrics.rawSystem.memory")}
                    live
                    datasets={[datasets.memory]}
                    loading={datasets.memory.length === 0}
                    yMin={0}
                    yMax={100}
                />
            </div>
        </div>
    );
};
