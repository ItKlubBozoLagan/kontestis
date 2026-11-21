import type { BaseSystemMetrics, KubernetesSystemMetrics, SystemMetrics } from "@kontestis/models";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Container, HardDrive, Server } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { type StatisticRange, statsQueries } from "@/api/stats";
import { EmptyState } from "@/components/common/EmptyState";
import { Section } from "@/components/common/Section";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";
import { CountHistoryChart, LiveUsageChart, type UsagePoint } from "@/features/admin/charts";

const HISTORY = 40;
const POLL_MS = 1000;

const cpuPercent = (metrics: Pick<BaseSystemMetrics, "cpus" | "cpuUsage">) =>
    metrics.cpus > 0 ? metrics.cpuUsage / metrics.cpus : 0;

const memoryPercent = (
    metrics: Pick<BaseSystemMetrics, "memoryMegabytes" | "memoryUsageMegabytes">
) =>
    metrics.memoryMegabytes > 0
        ? (metrics.memoryUsageMegabytes / metrics.memoryMegabytes) * 100
        : 0;

const gib = (megabytes: number) => Math.ceil(megabytes / 1024);

const MetricBox = ({ title, children }: { title: ReactNode; children: ReactNode }) => (
    <div className="bg-card flex min-w-0 flex-col gap-2 rounded-md border p-3">
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {title}
        </span>
        {children}
    </div>
);

const UsageBox = ({
    title,
    detail,
    percent,
}: {
    title: ReactNode;
    detail: ReactNode;
    percent: number;
}) => (
    <MetricBox title={title}>
        <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-semibold">{detail}</span>
            <span className="font-mono text-lg font-semibold tabular-nums">
                {percent.toFixed(2)}%
            </span>
        </div>
        <Progress value={Math.min(100, percent)} className="h-1.5" />
    </MetricBox>
);

/** Keeps the last HISTORY samples of usage for the live charts. */
const useUsageHistory = (metrics: SystemMetrics | undefined, updatedAt: number) => {
    const [cpu, setCpu] = useState<UsagePoint[]>([]);
    const [memory, setMemory] = useState<UsagePoint[]>([]);

    useEffect(() => {
        if (!metrics) return;

        const time = updatedAt;
        const cluster = { cpu: cpuPercent(metrics), memory: memoryPercent(metrics) };
        const kontestis =
            metrics.type === "kubernetes"
                ? (() => {
                      const pods = metrics.kubeData.pods.reduce(
                          (sum, pod) => ({
                              cpuUsage: sum.cpuUsage + pod.cpuUsage,
                              memoryUsageMegabytes:
                                  sum.memoryUsageMegabytes + pod.memoryUsageMegabytes,
                          }),
                          { cpuUsage: 0, memoryUsageMegabytes: 0 }
                      );

                      return {
                          cpu: cpuPercent({ cpus: metrics.cpus, cpuUsage: pods.cpuUsage }),
                          memory: memoryPercent({
                              memoryMegabytes: metrics.memoryMegabytes,
                              memoryUsageMegabytes: pods.memoryUsageMegabytes,
                          }),
                      };
                  })()
                : undefined;

        setCpu((previous) =>
            [
                ...previous,
                { time, value: cluster.cpu, ...(kontestis ? { kontestis: kontestis.cpu } : {}) },
            ].slice(-HISTORY)
        );
        setMemory((previous) =>
            [
                ...previous,
                {
                    time,
                    value: cluster.memory,
                    ...(kontestis ? { kontestis: kontestis.memory } : {}),
                },
            ].slice(-HISTORY)
        );
    }, [metrics, updatedAt]);

    return { cpu, memory };
};

const KubernetesBoxes = ({ metrics }: { metrics: KubernetesSystemMetrics }) => {
    const { t } = useTranslation();

    return (
        <>
            <MetricBox title={t("admin.overview.metrics.appScale")}>
                <Collapsible>
                    <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 text-sm font-semibold">
                        <span className="flex items-center gap-1">
                            <ChevronRight className="size-4 transition-transform group-data-[state=open]:rotate-90" />
                            {t("admin.overview.metrics.pods")}
                        </span>
                        <span className="font-mono text-lg">{metrics.kubeData.appScale}</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="flex flex-col gap-0.5 pt-1 pl-5 font-mono text-xs">
                        {metrics.kubeData.sisterPodNames.map((name) => (
                            <span key={name} className="truncate" title={name}>
                                {name}
                            </span>
                        ))}
                    </CollapsibleContent>
                </Collapsible>
            </MetricBox>
            <MetricBox title={t("admin.overview.metrics.nodes")}>
                <Collapsible>
                    <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 text-sm font-semibold">
                        <span className="flex items-center gap-1">
                            <ChevronRight className="size-4 transition-transform group-data-[state=open]:rotate-90" />
                            {t("admin.overview.metrics.nodes")}
                        </span>
                        <span className="font-mono text-lg">{metrics.kubeData.nodes.length}</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="flex flex-col gap-2 pt-2">
                        {metrics.kubeData.nodes.map((node) => (
                            <div
                                key={node.name}
                                className="bg-muted flex flex-col gap-0.5 rounded-sm border p-2 text-xs"
                            >
                                <span className="truncate font-semibold" title={node.name}>
                                    {node.name}
                                </span>
                                <span
                                    className="text-muted-foreground truncate"
                                    title={node.osPrettyName}
                                >
                                    {node.osPrettyName}
                                </span>
                                <span className="flex justify-between">
                                    <span>
                                        {t("admin.overview.metrics.cpus", { count: node.cpus })}
                                    </span>
                                    <span className="font-mono">
                                        {cpuPercent(node).toFixed(2)}%
                                    </span>
                                </span>
                                <span className="flex justify-between">
                                    <span>
                                        {t("admin.overview.metrics.memory")} ·{" "}
                                        {t("admin.overview.metrics.memoryTotal", {
                                            size: gib(node.memoryMegabytes),
                                        })}
                                    </span>
                                    <span className="font-mono">
                                        {memoryPercent(node).toFixed(2)}%
                                    </span>
                                </span>
                            </div>
                        ))}
                    </CollapsibleContent>
                </Collapsible>
            </MetricBox>
        </>
    );
};

const SystemMetricsSection = () => {
    const { t } = useTranslation();
    const {
        data: metrics,
        dataUpdatedAt,
        isError,
    } = useQuery({
        ...statsQueries.systemMetrics(),
        refetchInterval: POLL_MS,
    });
    const history = useUsageHistory(metrics, dataUpdatedAt);

    if (isError && !metrics)
        return <EmptyState icon={Server} title={t("admin.overview.metrics.unavailable")} />;

    if (!metrics)
        return (
            <Section title={t("admin.overview.metrics.server")} icon={HardDrive}>
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        {Array.from({ length: 4 }, (_, index) => (
                            <Skeleton key={index} className="h-20" />
                        ))}
                    </div>
                    <Skeleton className="h-64" />
                </div>
            </Section>
        );

    const kubernetes = metrics.type === "kubernetes";
    const series = (label: string) =>
        kubernetes
            ? [
                  {
                      key: "value",
                      label: t("admin.overview.metrics.cluster"),
                      color: "var(--chart-1)",
                  },
                  {
                      key: "kontestis",
                      label: t("admin.overview.metrics.kontestis"),
                      color: "var(--chart-2)",
                  },
              ]
            : [{ key: "value", label, color: "var(--chart-1)" }];

    return (
        <Section
            title={
                kubernetes
                    ? t("admin.overview.metrics.kubernetes")
                    : t("admin.overview.metrics.server")
            }
            icon={kubernetes ? Container : HardDrive}
        >
            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {metrics.type === "kubernetes" && <KubernetesBoxes metrics={metrics} />}
                    <UsageBox
                        title={t("admin.overview.metrics.cpu")}
                        detail={t("admin.overview.metrics.cpus", { count: metrics.cpus })}
                        percent={cpuPercent(metrics)}
                    />
                    <UsageBox
                        title={t("admin.overview.metrics.memory")}
                        detail={t("admin.overview.metrics.memoryTotal", {
                            size: gib(metrics.memoryMegabytes),
                        })}
                        percent={memoryPercent(metrics)}
                    />
                    {metrics.type === "raw" && (
                        <>
                            <MetricBox title={t("admin.overview.metrics.operatingSystem")}>
                                <span
                                    className="truncate font-mono text-sm"
                                    title={metrics.osPrettyName}
                                >
                                    {metrics.osPrettyName}
                                </span>
                            </MetricBox>
                            <MetricBox title={t("admin.overview.metrics.hostname")}>
                                <span
                                    className="truncate font-mono text-sm"
                                    title={metrics.hostname}
                                >
                                    {metrics.hostname}
                                </span>
                            </MetricBox>
                        </>
                    )}
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <LiveUsageChart
                        title={t("admin.overview.metrics.cpu")}
                        points={history.cpu}
                        series={series(t("admin.overview.metrics.cpu"))}
                        seconds={(HISTORY * POLL_MS) / 1000}
                    />
                    <LiveUsageChart
                        title={t("admin.overview.metrics.memory")}
                        points={history.memory}
                        series={series(t("admin.overview.metrics.memory"))}
                        seconds={(HISTORY * POLL_MS) / 1000}
                    />
                </div>
            </div>
        </Section>
    );
};

const StatisticsCharts = () => {
    const { t } = useTranslation();
    const [activityRange, setActivityRange] = useState<StatisticRange>("24h");
    const [loginRange, setLoginRange] = useState<StatisticRange>("24h");
    const [unique, setUnique] = useState(false);
    const [newLogins, setNewLogins] = useState(false);

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CountHistoryChart
                title={t("admin.overview.charts.activity")}
                range={activityRange}
                onRangeChange={setActivityRange}
                query={statsQueries.adminActivity(activityRange)}
            />
            <CountHistoryChart
                title={t("admin.overview.charts.logins")}
                range={loginRange}
                onRangeChange={setLoginRange}
                query={statsQueries.adminLogins(loginRange, unique, newLogins)}
                extraActions={
                    <>
                        <Toggle
                            size="sm"
                            variant="outline"
                            pressed={newLogins}
                            onPressedChange={setNewLogins}
                            className="text-xs"
                        >
                            {t("admin.overview.charts.newUsers")}
                        </Toggle>
                        <Toggle
                            size="sm"
                            variant="outline"
                            pressed={unique}
                            onPressedChange={setUnique}
                            className="text-xs"
                        >
                            {t("admin.overview.charts.unique")}
                        </Toggle>
                    </>
                }
            />
        </div>
    );
};

export const AdminOverviewPage = () => (
    <div className="flex w-full flex-col gap-6">
        <SystemMetricsSection />
        <StatisticsCharts />
    </div>
);
