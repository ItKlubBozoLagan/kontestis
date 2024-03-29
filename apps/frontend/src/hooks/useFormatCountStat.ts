import { useMemo } from "react";

import { Dataset } from "../components/HistoryLineChart";
import { StatisticResult, StringLiteral } from "./stats/types";

export const useFormatCountStat = <K extends string>(stat: StatisticResult<K>[] | undefined) =>
    useMemo(() => {
        if (!stat || stat.length === 0) return [];

        const key = Object.keys(stat[0]).find((it) => it !== "time")! as StringLiteral<K>;

        return stat.map(
            (it) =>
                ({ time: it.time, value: it[key as keyof typeof it] } as const satisfies Dataset)
        );
    }, [stat]);
