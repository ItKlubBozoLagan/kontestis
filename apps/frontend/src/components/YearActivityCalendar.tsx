import {
    CategoryScale,
    Chart as ChartJS,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
} from "chart.js";
import { useCallback, useMemo, useState } from "react";
import tw, { theme } from "twin.macro";

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
    loading?: boolean;
} & (
    | {
          toggles?: undefined;
          onToggleUpdate?: undefined;
      }
    | {
          // same as in HistoryLineChart.tsx
          toggles: T[];
          onToggleUpdate?: (toggle: T, value: boolean) => void;
      }
);

const getColorForCell = (percentage: number) => {
    if (percentage === 0) return theme`colors.neutral.400`;

    if (percentage < 0.25) return theme`colors.blue.400`;

    if (percentage < 0.5) return theme`colors.blue.500`;

    if (percentage < 0.75) return theme`colors.blue.600`;

    if (percentage <= 1) return theme`colors.blue.800`;
};

export const YearActivityCalendar = <T extends string>({
    title,
    dataset: originalDataset,
    loading,
    toggles,
    onToggleUpdate,
}: Properties<T>) => {
    const [toggleStates, setToggleStates] = useState(!toggles ? [] : toggles.map(() => false));

    const { t } = useTranslation();

    const [useRandomData, setUseRandomData] = useState(false);

    const dataset = useMemo(
        () =>
            !useRandomData
                ? originalDataset
                : Array.from({ length: 366 }, (_, index) => ({
                      time: new Date(2023, 3, 11 - index),
                      value: Math.random() <= 0.4 ? 0 : Math.floor(Math.random() * 32),
                  })),
        [useRandomData, originalDataset]
    );

    const weeks = useMemo(
        () =>
            R.pipe(
                dataset,
                R.reverse(),
                R.reduce((accumulator, current) => {
                    if (current.time.getDay() === 0 || accumulator.length === 0)
                        accumulator.push([current]);
                    else accumulator.at(-1)!.push(current);

                    return accumulator;
                }, [] as Dataset[][])
            ),
        [dataset]
    );

    const maxDay = useMemo(() => Math.max(1, ...dataset.map((it) => it.value)), [dataset]);

    const total = useMemo(
        () => dataset.reduce((accumulator, current) => accumulator + current.value, 0),
        [dataset]
    );

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
                "w-full flex flex-col gap-2 bg-neutral-100 border border-solid border-neutral-400 p-3"
            }
        >
            <div tw={"flex justify-between items-center gap-4"}>
                <div tw={"flex items-center gap-4"}>
                    <span tw={"text-lg"}>{title}</span>
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
                    {import.meta.env.DEV && (
                        <div tw={"flex"}>
                            <div
                                tw={
                                    "px-1.5 p-0.5 bg-neutral-300 border border-solid border-neutral-400 text-sm select-none cursor-pointer"
                                }
                                css={!useRandomData ? tw`bg-neutral-200` : ""}
                                onClick={() => setUseRandomData((data) => !data)}
                            >
                                {t("account.stats.submissions.toggles.showRandom")}
                            </div>
                        </div>
                    )}
                </div>
                <span>
                    {t("account.stats.submissions.total")}: {total}
                </span>
            </div>
            <div tw={"w-full relative flex"}>
                {loading ? (
                    <div
                        tw={
                            "flex w-full h-full justify-center items-center min-h-[92px] min-w-[46rem]"
                        }
                    >
                        <LoadingSpinner size={"base"} />
                    </div>
                ) : (
                    <div tw={"flex gap-[3px] [div:first-child]:self-end"}>
                        {weeks.map((week, index) => (
                            <div key={index} tw={"flex flex-col gap-[3px]"}>
                                {week.map(({ time, value }, index) => (
                                    <div
                                        key={index}
                                        tw={"w-[9px] h-[9px] relative"}
                                        className={"group"}
                                        style={{ backgroundColor: getColorForCell(value / maxDay) }}
                                    >
                                        <div
                                            css={[
                                                tw`absolute -top-8 z-10 cursor-pointer w-max bg-neutral-300/80 rounded-sm px-1.5 py-0.5`,
                                                tw`hidden group-hover:block`,
                                                tw`border border-solid border-neutral-800`,
                                            ]}
                                            style={{
                                                transform: "translateX(-50%)",
                                            }}
                                        >
                                            <span tw={"font-bold"}>
                                                {value} {/* got to love languages and plurals */}
                                                {value % 10 === 1 && (value < 10 || value > 20)
                                                    ? t(
                                                          "account.stats.submissions.hover.oneSubmission"
                                                      )
                                                    : value % 10 >= 2 &&
                                                      value % 10 <= 4 &&
                                                      (value < 11 || value > 14)
                                                    ? t(
                                                          "account.stats.submissions.hover.fewSubmissions"
                                                      )
                                                    : t(
                                                          "account.stats.submissions.hover.moreSubmissions"
                                                      )}
                                            </span>{" "}
                                            {time.getDate()}.{" "}
                                            {RangeFormatters["1y"](time, index, t)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
