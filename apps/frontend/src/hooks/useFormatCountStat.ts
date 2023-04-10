import { useMemo } from "react";

import { Dataset } from "../components/HistoryLineChart";
import { CountStat } from "./stats/types";

export const useFormatCountStat = (stat: CountStat[] | undefined) =>
    useMemo(() => {
        if (!stat) return [];

        return stat.map((it) => ({ time: it.time, value: it.count } satisfies Dataset));
    }, [stat]);
