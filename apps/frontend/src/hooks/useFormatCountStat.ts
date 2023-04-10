import { useMemo } from "react";

import { Dataset } from "../components/HistoryLineChart";
import { CountStatistic } from "./stats/types";

export const useFormatCountStat = (stat: CountStatistic[] | undefined) =>
    useMemo(() => {
        if (!stat) return [];

        return stat.map((it) => ({ time: it.time, value: it.count } satisfies Dataset));
    }, [stat]);
