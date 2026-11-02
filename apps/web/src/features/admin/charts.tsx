import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { TrendingDown, TrendingUp } from "lucide-react";
import { type ReactNode, useId } from "react";
import { useTranslation } from "react-i18next";
import { Area, AreaChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import type { CountStatisticWithPeriod, StatisticRange } from "@/api/stats";
import {
    type ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export const RANGES: StatisticRange[] = ["24h", "7d", "30d", "1y"];

const tickFormat = (range: StatisticRange) =>
    range === "24h" ? "HH:mm" : range === "1y" ? "MM/yy" : "dd.MM.";

export const ChartCard = ({
    title,
    badge,
    actions,
    children,
    className,
}: {
    title: ReactNode;
    badge?: ReactNode;
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
}) => (
    <div className={cn("bg-card flex min-w-0 flex-col gap-3 rounded-md border p-4", className)}>
        <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
                <span className="text-base font-medium">{title}</span>
                {badge}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {children}
    </div>
);

export const RangeToggle = ({
    value,
    onChange,
}: {
    value: StatisticRange;
    onChange: (range: StatisticRange) => void;
}) => {
    const { t } = useTranslation();

    return (
        <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            value={value}
            onValueChange={(next) => next && onChange(next as StatisticRange)}
        >
            {RANGES.map((range) => (
                <ToggleGroupItem key={range} value={range} className="px-2.5 font-mono text-xs">
                    {t(`admin.ranges.${range}`)}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    );
};

export const PeriodChange = ({ change }: { change: number | undefined }) => {
    const { t } = useTranslation();

    if (change === undefined) return null;

    const positive = change >= 0;
    const Icon = positive ? TrendingUp : TrendingDown;
    const label = `${positive ? "+" : ""}${(change * 100).toFixed(2)}%`;

    return (
        <span
            title={t("admin.overview.charts.previousPeriod", { change: label })}
            className={cn(
                "flex items-center gap-1 font-mono text-sm font-semibold",
                positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}
        >
            <Icon className="size-4" />
            {label}
        </span>
    );
};

/** Count-per-window history chart for an admin statistic (activity, logins). */
export const CountHistoryChart = ({
    title,
    range,
    onRangeChange,
    query,
    extraActions,
}: {
    title: ReactNode;
    range: StatisticRange;
    onRangeChange: (range: StatisticRange) => void;
    query: { queryKey: readonly unknown[]; queryFn?: unknown };
    extraActions?: ReactNode;
}) => {
    const { t } = useTranslation();
    const gradient = useId().replace(/:/g, "");
    const { data } = useQuery({
        ...(query as { queryKey: unknown[]; queryFn: () => Promise<CountStatisticWithPeriod> }),
        refetchInterval: 5000,
        placeholderData: keepPreviousData,
    });

    const config = {
        count: { label: t("admin.overview.charts.count"), color: "var(--chart-1)" },
    } satisfies ChartConfig;

    const points = (data?.stats ?? []).map((it) => ({ time: it.time.getTime(), count: it.count }));

    return (
        <ChartCard
            title={title}
            badge={<PeriodChange change={data?.previousPeriodChange} />}
            actions={
                <>
                    {extraActions}
                    <RangeToggle value={range} onChange={onRangeChange} />
                </>
            }
        >
            {!data ? (
                <Skeleton className="h-56 w-full" />
            ) : (
                <ChartContainer config={config} className="aspect-auto h-56 w-full">
                    <AreaChart data={points} margin={{ left: 0, right: 8, top: 8 }}>
                        <defs>
                            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-count)"
                                    stopOpacity={0.4}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-count)"
                                    stopOpacity={0.02}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="time"
                            type="number"
                            scale="time"
                            domain={["dataMin", "dataMax"]}
                            tickFormatter={(value: number) => format(value, tickFormat(range))}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={24}
                        />
                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(_, payload) =>
                                        payload?.[0]
                                            ? format(
                                                  payload[0].payload.time as number,
                                                  "dd.MM.yyyy. HH:mm"
                                              )
                                            : ""
                                    }
                                />
                            }
                        />
                        <Area
                            dataKey="count"
                            type="monotone"
                            stroke="var(--color-count)"
                            strokeWidth={2}
                            fill={`url(#${gradient})`}
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ChartContainer>
            )}
        </ChartCard>
    );
};

export type UsagePoint = { time: number; [series: string]: number };

/** Live percentage chart (0-100) for CPU/memory usage, one line per series. */
export const LiveUsageChart = ({
    title,
    points,
    series,
    seconds,
}: {
    title: ReactNode;
    points: UsagePoint[];
    series: { key: string; label: string; color: string }[];
    seconds: number;
}) => {
    const { t } = useTranslation();
    const config = Object.fromEntries(
        series.map((it) => [it.key, { label: it.label, color: it.color }])
    ) satisfies ChartConfig;

    return (
        <ChartCard
            title={title}
            badge={
                <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <span className="size-1.5 animate-pulse rounded-full bg-green-500" />
                    {t("admin.overview.metrics.live", { seconds })}
                </span>
            }
        >
            <ChartContainer config={config} className="aspect-auto h-52 w-full">
                <LineChart data={points} margin={{ left: 0, right: 8, top: 8 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="time"
                        type="number"
                        domain={["dataMin", "dataMax"]}
                        tickFormatter={(value: number) => format(value, "HH:mm:ss")}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={32}
                    />
                    <YAxis
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                        tickFormatter={(value: number) => `${value}%`}
                        tickLine={false}
                        axisLine={false}
                        width={40}
                    />
                    <ChartTooltip
                        content={
                            <ChartTooltipContent
                                labelFormatter={(_, payload) =>
                                    payload?.[0]
                                        ? format(payload[0].payload.time as number, "HH:mm:ss")
                                        : ""
                                }
                                formatter={(value, name) => (
                                    <span className="flex w-full justify-between gap-3">
                                        <span className="text-muted-foreground">
                                            {config[name as string]?.label}
                                        </span>
                                        <span className="font-mono">
                                            {Number(value).toFixed(2)}%
                                        </span>
                                    </span>
                                )}
                            />
                        }
                    />
                    {series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
                    {series.map((it) => (
                        <Line
                            key={it.key}
                            dataKey={it.key}
                            type="monotone"
                            stroke={`var(--color-${it.key})`}
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                        />
                    ))}
                </LineChart>
            </ChartContainer>
        </ChartCard>
    );
};
