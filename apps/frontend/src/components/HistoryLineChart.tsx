import { hexToRgba } from "@kontestis/utils";
import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement } from "chart.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import { ChartJSOrUndefined } from "react-chartjs-2/dist/types";
import { FiMinus, FiTrendingDown, FiTrendingUp } from "react-icons/all";
import tw, { theme } from "twin.macro";

import { StatisticRange } from "../hooks/stats/types";
import { useTranslation } from "../hooks/useTranslation";
import { useWindowEvent } from "../hooks/useWindowEvent";
import { RangeFormatters } from "../util/charts";
import { R } from "../util/remeda";
import { LoadingSpinner } from "./LoadingSpinner";

ChartJS.register(LineElement, LinearScale, CategoryScale, Legend);

export type Dataset = {
    time: Date;
    value: number;
};

type ChartDataset = {
    x: number | string;
    y: number;
};

const DatasetColors = [theme`colors.neutral.600`, theme`colors.sky.500`];

// woah, that's a lot of props
//  TODO: clean up
export type Properties<T extends string> = {
    title: string;
    datasets: Dataset[][];
    datasetLabels?: string[];
    previousPeriodChange?: number;
    loading?: boolean;
    onRangeChange?: (range: StatisticRange) => void;
    dark?: boolean;
    yMin?: number;
    yMax?: number;
    tension?: number;
} & (
    | {
          live?: false;
          activeRange: StatisticRange;
      }
    | { live: true; activeRange?: undefined }
) &
    (
        | {
              toggles?: undefined;
              onToggleUpdate?: undefined;
          }
        | {
              // toggles are supposed to be settings that can be turned on or off (true of false)
              //  e.g. logins can show a graph of non-unique (all) and unique logins, here unique is a toggle
              toggles: T[];
              onToggleUpdate?: (toggle: T, value: boolean) => void;
          }
    );

export const HistoryLineChart = <T extends string>({
    title,
    datasets,
    datasetLabels,
    activeRange,
    loading,
    onRangeChange,
    previousPeriodChange,
    dark,
    live,
    toggles,
    onToggleUpdate,
    yMin,
    yMax,
    tension,
}: Properties<T>) => {
    const chartReference = useRef<ChartJSOrUndefined<"line", ChartDataset[]>>();

    const [range, setRange] = useState<StatisticRange>("24h");
    const [toggleStates, setToggleStates] = useState(!toggles ? [] : toggles.map(() => false));

    const [labelSelected, setLabelSelected] = useState(datasetLabels?.map(() => false) ?? []);

    const { t } = useTranslation();

    const formattedDataset = useMemo(
        () =>
            datasets.map((dataset) =>
                R.pipe(
                    dataset,
                    !live ? R.reverse() : R.identity,
                    R.map.indexed(({ time, value }, index) => ({
                        x: !live
                            ? RangeFormatters[activeRange](time, index, t)
                            : time.toISOString(),
                        y: value,
                    }))
                )
            ),

        [datasets, t]
    );

    useEffect(() => {
        onRangeChange?.(range);
    }, [range]);

    useWindowEvent("resize", () => {
        chartReference.current?.resize();
    });

    // nice name lol
    const toggleToggle = useCallback(
        (toggle: T) => {
            if (!toggles) return;

            const currentIndex = toggles.indexOf(toggle);

            setToggleStates((states) =>
                states.map((state, index) => (currentIndex === index ? !state : state))
            );
            onToggleUpdate?.(toggle, !toggleStates[currentIndex]);
        },
        [toggles]
    );

    return (
        <div
            tw={
                "w-full flex flex-col gap-4 bg-neutral-100 border border-solid border-neutral-400 p-2"
            }
            css={dark ? tw`bg-neutral-200 border-2 border-neutral-400` : ""}
        >
            <div tw={"flex justify-between items-center gap-4"}>
                <div tw={"flex items-center gap-3"}>
                    <span tw={"text-lg"}>{title}</span>
                    {previousPeriodChange !== undefined && (
                        <div tw={"flex flex-col"}>
                            <div
                                tw={"flex gap-1 items-center"}
                                css={
                                    previousPeriodChange === 0
                                        ? tw`text-neutral-600`
                                        : previousPeriodChange > 0
                                        ? tw`text-green-700`
                                        : tw`text-red-700`
                                }
                            >
                                {previousPeriodChange === 0 ? (
                                    <FiMinus size={"16px"} />
                                ) : previousPeriodChange > 0 ? (
                                    <FiTrendingUp size={"16px"} />
                                ) : (
                                    <FiTrendingDown size={"16px"} />
                                )}
                                <span tw={"text-base font-bold"}>
                                    {(previousPeriodChange * 100).toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    )}
                </div>
                <div tw={"flex items-center gap-2"}>
                    {toggles && (
                        <div tw={"flex"}>
                            {toggles.map((it, index) => (
                                <div
                                    key={it}
                                    tw={
                                        "px-1.5 p-0.5 bg-neutral-300 border border-solid border-neutral-400 text-sm select-none cursor-pointer"
                                    }
                                    css={[
                                        !toggleStates[index] ? tw`bg-neutral-200` : "",
                                        index !== 0 ? tw`border-l-0` : "",
                                    ]}
                                    onClick={() => toggleToggle(it)}
                                >
                                    {it}
                                </div>
                            ))}
                        </div>
                    )}
                    {!live && (
                        <div tw={"flex"}>
                            {(["24h", "7d", "30d", "1y"] as const).map((it, index) => (
                                <div
                                    key={it}
                                    tw={
                                        "px-1.5 p-0.5 bg-neutral-300 border border-solid border-neutral-400 text-sm select-none cursor-pointer"
                                    }
                                    css={[
                                        range === it ? tw`bg-neutral-200` : "",
                                        index !== 0 ? tw`border-l-0` : "",
                                    ]}
                                    onClick={() => setRange(it)}
                                >
                                    {it}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div tw={"w-full relative flex pr-2"}>
                {loading ? (
                    <div tw={"flex w-full h-full justify-center items-center min-h-[200px]"}>
                        <LoadingSpinner size={"base"} />
                    </div>
                ) : (
                    <Line
                        ref={chartReference}
                        tw={"max-w-full"}
                        data={{
                            labels: datasetLabels,
                            datasets: formattedDataset.map((dataset, index) => ({
                                data: dataset,
                                borderColor: ((color) =>
                                    labelSelected[index] && labelSelected.some(R.identity)
                                        ? hexToRgba(color, 0.4)
                                        : color)(DatasetColors[index] ?? theme`colors.neutral.400`),
                                pointRadius: 0,
                                tension: tension ?? 0.2,
                            })),
                        }}
                        options={{
                            responsive: true,
                            animation: false,
                            scales: {
                                y: {
                                    min: yMin ?? 0,
                                    max: yMax,
                                },
                                x: {
                                    display: live ? false : undefined,
                                },
                            },
                            plugins: {
                                legend: {
                                    display: datasets.length > 1,
                                    align: "end",
                                    position: "bottom",
                                    labels: {
                                        usePointStyle: true,
                                        boxHeight: 6,
                                        generateLabels: (chart) => {
                                            return datasets.map((it, index) => ({
                                                text:
                                                    (chart.data.labels?.[index] as string) ??
                                                    `Dataset ${index + 1}`,
                                                fontColor:
                                                    DatasetColors[index] ??
                                                    theme`colors.neutral.400`,
                                                fillStyle:
                                                    DatasetColors[index] ??
                                                    theme`colors.neutral.400`,
                                                lineWidth: 0,
                                                hidden: labelSelected[index],
                                            }));
                                        },
                                    },
                                    onClick: (_, legendItem) => {
                                        const index = datasetLabels?.indexOf(legendItem.text) ?? -1;

                                        setLabelSelected((selected) =>
                                            selected.map((_, labelIndex) =>
                                                labelIndex === index ? !selected[index] : false
                                            )
                                        );
                                    },
                                    onHover: (event) => {
                                        const target = event.native?.target;

                                        if (target instanceof HTMLElement)
                                            target.style["cursor"] = "pointer";
                                    },
                                },
                            },
                        }}
                    />
                )}
            </div>
        </div>
    );
};
