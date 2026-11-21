import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { type StatisticRange, statsQueries } from "@/api/stats";
import { Section } from "@/components/common/Section";
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const RANGES: StatisticRange[] = ["24h", "7d", "30d", "1y"];

const formatTick = (time: number, range: StatisticRange) => {
    const date = new Date(time);

    if (range === "24h")
        return date.toLocaleTimeString("hr-HR", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Zagreb",
        });

    if (range === "1y")
        return date.toLocaleDateString("hr-HR", { month: "2-digit", year: "2-digit" });

    return date.toLocaleDateString("hr-HR", { day: "2-digit", month: "2-digit" });
};

export const EloChart = () => {
    const { t } = useTranslation();
    const [range, setRange] = useState<StatisticRange>("30d");
    const { data, isPending } = useQuery(statsQueries.elo(range));

    const config = { elo: { label: "Elo", color: "var(--chart-1)" } } satisfies ChartConfig;

    const points = useMemo(
        () =>
            [...(data ?? [])]
                .sort((a, b) => a.time.getTime() - b.time.getTime())
                .map((it) => ({ time: it.time.getTime(), elo: it.last })),
        [data]
    );

    const domain = useMemo(() => {
        const values = points.map((it) => it.elo);

        if (values.length === 0) return [800, 1200];

        const min = Math.min(...values);
        const max = Math.max(...values);

        return max === min ? [min - 200, max + 200] : [min - 50, max + 50];
    }, [points]);

    return (
        <Section
            title={t("account.stats.elo")}
            actions={
                <ToggleGroup
                    type="single"
                    variant="outline"
                    size="sm"
                    value={range}
                    onValueChange={(value) => value && setRange(value as StatisticRange)}
                >
                    {RANGES.map((it) => (
                        <ToggleGroupItem key={it} value={it} className="px-2.5 font-mono text-xs">
                            {t(`account.stats.ranges.${it}`)}
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
            }
        >
            {isPending ? (
                <Skeleton className="h-64 w-full" />
            ) : (
                <ChartContainer config={config} className="h-64 w-full">
                    <LineChart data={points} margin={{ left: 4, right: 12, top: 8 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="time"
                            type="number"
                            scale="time"
                            domain={["dataMin", "dataMax"]}
                            tickFormatter={(value: number) => formatTick(value, range)}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={24}
                        />
                        <YAxis
                            domain={domain}
                            tickLine={false}
                            axisLine={false}
                            width={44}
                            allowDecimals={false}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(_, payload) => {
                                        const time = payload?.[0]?.payload?.time as
                                            | number
                                            | undefined;

                                        return time
                                            ? new Date(time).toLocaleString("hr-HR", {
                                                  timeZone: "Europe/Zagreb",
                                              })
                                            : "";
                                    }}
                                />
                            }
                        />
                        <Line
                            dataKey="elo"
                            type="stepAfter"
                            stroke="var(--color-elo)"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ChartContainer>
            )}
        </Section>
    );
};
