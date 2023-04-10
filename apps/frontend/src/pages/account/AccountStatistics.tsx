import { FC, useState } from "react";

import { HistoryLineChart } from "../../components/HistoryLineChart";
import { CountStatisticRange } from "../../hooks/stats/types";
import { useEloStat } from "../../hooks/stats/useEloStat";
import { useFormatCountStat } from "../../hooks/useFormatCountStat";

export const AccountStatistics: FC = () => {
    const [eloRange, setEloRange] = useState<CountStatisticRange>("24h");

    const { data: elo, isLoading: isEloLoading } = useEloStat(eloRange);

    const eloDataset = useFormatCountStat(elo);

    return (
        <div tw={"w-2/3 mt-4 flex flex-col items-center gap-2"}>
            <HistoryLineChart
                title={"Elo"}
                dataset={eloDataset}
                activeRange={eloRange}
                onRangeChange={setEloRange}
                loading={isEloLoading}
            />
        </div>
    );
};
