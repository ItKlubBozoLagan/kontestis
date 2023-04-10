import {
    CategoryScale,
    Chart as ChartJS,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
} from "chart.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { FiMinus, FiTrendingDown, FiTrendingUp } from "react-icons/all";
import tw, { theme } from "twin.macro";

import { CountStatisticRange } from "../hooks/stats/types";
import { useTranslation } from "../hooks/useTranslation";
import { RangeFormatters } from "../util/charts";
import { R } from "../util/remeda";
import { LoadingSpinner } from "./LoadingSpinner";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip);

export type Dataset = {
    time: Date;
    value: number;
};

export type Properties<T extends string> = {
    title: string;
    dataset: Dataset[];
    activeRange: CountStatisticRange;
    previousPeriodChange?: number;
    loading?: boolean;
    onRangeChange?: (range: CountStatisticRange) => void;
    dark?: boolean;
    baseline?: number;
} & (
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
    dataset,
    activeRange,
    loading,
    onRangeChange,
    previousPeriodChange,
    dark,
    toggles,
    onToggleUpdate,
}: Properties<T>) => {
    const [range, setRange] = useState<CountStatisticRange>("24h");
    const [toggleStates, setToggleStates] = useState(!toggles ? [] : toggles.map(() => false));

    const { t } = useTranslation();

    const formattedDataset = useMemo(
        () =>
            R.pipe(
                dataset,
                R.reverse(),
                R.map.indexed(({ time, value }, index) => ({
                    x: RangeFormatters[activeRange](time, index, t),
                    y: value,
                }))
            ),
        [dataset, t]
    );

    useEffect(() => {
        onRangeChange?.(range);
    }, [range]);

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
                "w-full flex flex-col gap-4 bg-neutral-50 border-2 border-solid border-neutral-400 p-2"
            }
            css={dark ? tw`bg-neutral-200` : ""}
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
                </div>
            </div>
            <div tw={"w-full relative flex pr-2"}>
                {loading ? (
                    <div tw={"flex w-full h-full justify-center items-center min-h-[200px]"}>
                        <LoadingSpinner size={"base"} />
                    </div>
                ) : (
                    <Line
                        tw={"max-w-full"}
                        data={{
                            datasets: [
                                {
                                    data: formattedDataset,
                                    borderColor: theme`colors.neutral.600`,
                                    pointRadius: 0,
                                    tension: 0.2,
                                },
                            ],
                        }}
                        options={{
                            responsive: true,
                            animation: false,
                            plugins: {
                                tooltip: {
                                    enabled: true,
                                },
                            },
                            scales: {
                                y: {
                                    min: 0,
                                    max: 6000,
                                },
                            },
                        }}
                    />
                )}
            </div>
        </div>
    );
};
