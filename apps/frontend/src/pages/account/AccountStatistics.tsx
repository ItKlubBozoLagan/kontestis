import { FC, useMemo, useState } from "react";

import { HistoryLineChart } from "../../components/HistoryLineChart";
import { StatisticRange } from "../../hooks/stats/types";
import { useEloStat } from "../../hooks/stats/useEloStat";
import { useFormatCountStat } from "../../hooks/useFormatCountStat";

export const AccountStatistics: FC = () => {
    const [eloRange, setEloRange] = useState<StatisticRange>("24h");

    const { data: elo, isLoading: isEloLoading } = useEloStat(eloRange);

    const eloDataset = useFormatCountStat(elo);

    const [yMin, yMax] = useMemo(() => {
        const values = eloDataset.map((it) => it.value as number);

        const max = Math.max(...values);
        const min = Math.min(...values);

        if (max === min) return [min - 200, max + 200];

        return [min - 50, max + 50];
    }, [eloDataset]);

    return (
        <div tw={"w-2/3 mt-4 flex flex-col items-center gap-2"}>
            <HistoryLineChart
                title={"Elo"}
                dataset={eloDataset}
                activeRange={eloRange}
                onRangeChange={setEloRange}
                loading={isEloLoading}
                yMin={yMin}
                yMax={yMax}
                tension={0}
            />
        </div>
    );
};
