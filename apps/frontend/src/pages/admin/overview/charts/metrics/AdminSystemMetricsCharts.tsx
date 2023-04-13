import { SystemMetrics } from "@kontestis/models";
import { capitalize } from "@kontestis/utils";
import { FC } from "react";
import { IconType } from "react-icons";
import { FiHardDrive } from "react-icons/all";
import { SiKubernetes } from "react-icons/si";
import { theme } from "twin.macro";

import { BigTitledSection } from "../../../../../components/BigTitledSection";
import { LoadingSpinner } from "../../../../../components/LoadingSpinner";
import { useSystemMetrics } from "../../../../../hooks/stats/metrics/useSystemMetrics";
import { AdminRawSystemMetricsCharts } from "./AdminRawSystemMetricsCharts";
import { AdminKubernetesSystemMetricsCharts } from "./kubernetes/AdminKubernetesSystemMetricsCharts";

export const MetricIconMap: Record<
    SystemMetrics["type"],
    { icon: IconType; color: string; size: `${number}px` }
> = {
    raw: {
        icon: FiHardDrive,
        color: theme`colors.black`,
        size: "18px",
    },
    kubernetes: {
        icon: SiKubernetes,
        color: "#326ce5",
        size: "22px",
    },
};

export const AdminSystemMetricsCharts: FC = () => {
    const { data: metrics, isLoading: isMetricsLoading } = useSystemMetrics({
        refetchInterval: 1000,
    });

    if (!metrics || isMetricsLoading)
        return (
            <div tw={"w-full h-64 flex items-center justify-center"}>
                <LoadingSpinner size={"lg"} />
            </div>
        );

    const { icon: Icon, color: iconColor, size: iconSize } = MetricIconMap[metrics.type];

    return (
        <div tw={"flex flex-col gap-2"}>
            <BigTitledSection
                header={
                    <div tw={"flex gap-2 items-center"}>
                        <Icon color={iconColor} size={iconSize} />
                        <span>{capitalize(metrics.type === "raw" ? "Server" : metrics.type)}</span>
                    </div>
                }
            >
                <div tw={"w-full"}>
                    {metrics.type === "raw" ? (
                        <AdminRawSystemMetricsCharts metrics={metrics} />
                    ) : (
                        <AdminKubernetesSystemMetricsCharts metrics={metrics} />
                    )}
                </div>
            </BigTitledSection>
        </div>
    );
};
