import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";
import { LastStatistic, StatisticRange } from "./types";

type Parameters = {
    range: StatisticRange;
};

export const useEloStat: QueryHandler<LastStatistic[], Parameters> = ({ range }, options) =>
    useQuery({
        queryKey: ["stats", "elo", range],
        queryFn: () => wrapAxios(http.get(`/stats/elo?range=${range}`)),
        ...options,
    });
