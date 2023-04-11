import { capitalize } from "@kontestis/utils";
import { FC } from "react";

import { LoadingSpinner } from "../../../components/LoadingSpinner";
import { useSystemMetrics } from "../../../hooks/stats/metrics/useSystemMetrics";
import { AdminRawSystemMetricsCharts } from "./AdminRawSystemMetricsCharts";

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

    return (
        <div tw={"flex flex-col gap-2"}>
            <div
                tw={
                    "flex flex-col gap-2 p-4 bg-neutral-200 border-2 border-solid border-neutral-400"
                }
            >
                <span tw={"text-lg"}>
                    Detected environment:{" "}
                    {capitalize(metrics.type === "raw" ? "None" : metrics.type)}
                </span>
                {metrics.type === "raw" ? (
                    <AdminRawSystemMetricsCharts metrics={metrics} />
                ) : (
                    <div tw={"w-full flex flex-col gap-2"}>
                        <span tw={"font-bold"}>
                            Not fully implemented yet, here&apos;s pod names:
                        </span>
                        <div tw={"flex flex-col"}>
                            {metrics.kubeData.sisterPodNames.map((it) => (
                                <span key={it}>{it}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
